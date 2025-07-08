import { type CustomNode } from "@/types/nodes";
import { type Edge } from "@xyflow/react";
import { useStore } from "./store";
import { LLMService, type LLMParams } from "./llm-service";
import { NodeType } from "@/types/nodes";

export class ExecutionEngine {
  private abortController: AbortController | null = null;

  // Find all input nodes for a given node
  private getInputNodes(
    nodeId: string,
    edges: Edge[],
    nodes: CustomNode[]
  ): CustomNode[] {
    const inputEdges = edges.filter((edge) => edge.target === nodeId);
    return inputEdges
      .map((edge) => nodes.find((node) => node.id === edge.source))
      .filter(Boolean) as CustomNode[];
  }

  // Find all output nodes for a given node
  private getOutputNodes(
    nodeId: string,
    edges: Edge[],
    nodes: CustomNode[]
  ): CustomNode[] {
    const outputEdges = edges.filter((edge) => edge.source === nodeId);
    return outputEdges
      .map((edge) => nodes.find((node) => node.id === edge.target))
      .filter(Boolean) as CustomNode[];
  }

  // Check if all input nodes for a given node are completed
  private areInputsReady(
    nodeId: string,
    edges: Edge[],
    nodes: CustomNode[]
  ): boolean {
    const inputNodes = this.getInputNodes(nodeId, edges, nodes);
    return inputNodes.every((node) => (node.data as any).status === "success");
  }

  // Get the text content from input nodes
  private getInputText(
    nodeId: string,
    edges: Edge[],
    nodes: CustomNode[]
  ): string {
    const inputNodes = this.getInputNodes(nodeId, edges, nodes);

    return inputNodes
      .map((node) => {
        if (node.type === NodeType.TEXT_PROMPT) {
          return (node.data as any).text;
        } else if (node.type === NodeType.OUTPUT) {
          return (node.data as any).content;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  // Execute a single node
  private async executeNode(
    node: CustomNode,
    edges: Edge[],
    nodes: CustomNode[]
  ): Promise<void> {
    try {
      (useStore.getState() as any).updateNodeStatus(node.id, "running");

      switch (node.type) {
        case NodeType.START:
          // Start node just marks as complete
          await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for visual feedback
          (useStore.getState() as any).updateNodeStatus(node.id, "success");
          break;

        case NodeType.TEXT_PROMPT:
          // Text prompt nodes are always ready (user input)
          (useStore.getState() as any).updateNodeStatus(node.id, "success");
          break;

        case NodeType.LLM_INVOCATION:
          await this.executeLLMNode(node, edges, nodes);
          break;

        case NodeType.OUTPUT:
          // Output nodes receive content from their inputs
          const inputText = this.getInputText(node.id, edges, nodes);
          (useStore.getState() as any).updateNodeData(node.id, {
            content: inputText,
            isStreaming: false,
          });
          (useStore.getState() as any).updateNodeStatus(node.id, "success");
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      (useStore.getState() as any).markNodeCompleted(node.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      (useStore.getState() as any).markNodeError(node.id, errorMessage);
    }
  }

  // Execute an LLM invocation node
  private async executeLLMNode(
    node: CustomNode,
    edges: Edge[],
    nodes: CustomNode[]
  ): Promise<void> {
    const nodeData = node.data as any;
    const inputText = this.getInputText(node.id, edges, nodes);

    if (!inputText.trim()) {
      throw new Error("No input text provided to LLM node");
    }

    // Find connected output nodes to stream to
    const outputNodes = this.getOutputNodes(node.id, edges, nodes);
    const outputNode = outputNodes.find((n) => n.type === NodeType.OUTPUT);

    const params: LLMParams = {
      model: nodeData.model,
      temperature: nodeData.temperature,
      maxTokens: nodeData.maxTokens,
      systemPrompt: nodeData.systemPrompt,
    };

    return new Promise((resolve, reject) => {
      LLMService.streamCompletion(inputText, params, {
        onStart: () => {
          if (outputNode) {
            (useStore.getState() as any).updateNodeData(outputNode.id, {
              isStreaming: true,
              content: "",
              streamedContent: "",
            });
            (useStore.getState() as any).updateNodeStatus(
              outputNode.id,
              "running"
            );
          }
        },

        onContent: (content: string) => {
          if (outputNode) {
            (useStore.getState() as any).updateNodeData(outputNode.id, {
              streamedContent: content,
            });
          }
        },

        onComplete: (finalContent: string, tokenCount?: number) => {
          (useStore.getState() as any).updateNodeStatus(node.id, "success");

          if (outputNode) {
            (useStore.getState() as any).updateNodeData(outputNode.id, {
              content: finalContent,
              isStreaming: false,
              streamedContent: "",
              tokenCount,
            });
            (useStore.getState() as any).updateNodeStatus(
              outputNode.id,
              "success"
            );
          }

          resolve();
        },

        onError: (error: string) => {
          if (outputNode) {
            (useStore.getState() as any).updateNodeStatus(
              outputNode.id,
              "error"
            );
          }
          reject(new Error(error));
        },
      });
    });
  }

  // Execute the entire workflow
  async executeWorkflow(): Promise<void> {
    const state = useStore.getState() as any;
    const { nodes, edges } = state;

    if (!nodes.length) {
      throw new Error("No nodes to execute");
    }

    this.abortController = new AbortController();
    state.startWorkflow();

    try {
      // Find the start node
      const startNodes = nodes.filter(
        (node: any) => node.type === NodeType.START
      );
      if (startNodes.length === 0) {
        throw new Error("No start node found");
      }

      // Execute nodes in dependency order
      const executedNodes = new Set<string>();
      const nodesToExecute = [...nodes];

      while (nodesToExecute.length > 0) {
        const readyNodes = nodesToExecute.filter((node) => {
          if (executedNodes.has(node.id)) return false;

          // Start nodes can always execute
          if (node.type === NodeType.START) return true;

          // Other nodes need their inputs ready
          return this.areInputsReady(node.id, edges, nodes);
        });

        if (readyNodes.length === 0) {
          // Check if we have remaining nodes but none are ready
          const remainingNodes = nodesToExecute.filter(
            (node) => !executedNodes.has(node.id)
          );
          if (remainingNodes.length > 0) {
            throw new Error(
              "Workflow has circular dependencies or disconnected nodes"
            );
          }
          break;
        }

        // Execute ready nodes in parallel
        await Promise.all(
          readyNodes.map(async (node) => {
            if (this.abortController?.signal.aborted) {
              throw new Error("Workflow execution aborted");
            }

            await this.executeNode(node, edges, nodes);
            executedNodes.add(node.id);
          })
        );

        // Remove executed nodes from the queue
        nodesToExecute.splice(0, nodesToExecute.length);
        nodesToExecute.push(
          ...nodes.filter((node: any) => !executedNodes.has(node.id))
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Workflow execution failed";
      console.error("Workflow execution error:", errorMessage);
      throw error;
    } finally {
      state.stopWorkflow();
      this.abortController = null;
    }
  }

  // Stop the current workflow execution
  stopExecution(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
    (useStore.getState() as any).stopWorkflow();
  }
}

// Singleton instance
export const executionEngine = new ExecutionEngine();
