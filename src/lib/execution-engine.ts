import { NodeType, type CustomNode } from "@/types/nodes";
import { type Edge } from "@xyflow/react";
import { LLMService, type LLMParams } from "./llm-service";
import { useStore } from "./store";

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

  // Reset connected output nodes to prepare them for new output
  private resetConnectedOutputNodes(
    nodeId: string,
    edges: Edge[],
    nodes: CustomNode[]
  ): void {
    const outputNodes = this.getOutputNodes(nodeId, edges, nodes);
    const connectedOutputNodes = outputNodes.filter(
      (n) => n.type === NodeType.OUTPUT
    );

    const state = useStore.getState();
    connectedOutputNodes.forEach((outputNode) => {
      // Reset output node data and status
      state.updateNodeDataDuringExecution(outputNode.id, {
        content: "",
        isStreaming: false,
        streamedContent: "",
        tokenCount: undefined,
        error: undefined,
      });
      state.updateNodeStatus(outputNode.id, "idle");
    });
  }

  // Execute a single node
  private async executeNode(
    node: CustomNode,
    edges: Edge[],
    nodes: CustomNode[]
  ): Promise<void> {
    const state = useStore.getState()
    try {
      state.updateNodeStatus(node.id, "running");

      switch (node.type) {
        case NodeType.START:
          // Start node just marks as complete
          await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay for visual feedback
          state.updateNodeStatus(node.id, "success");
          break;

        case NodeType.TEXT_PROMPT:
          // Reset connected output nodes before producing new output
          this.resetConnectedOutputNodes(node.id, edges, nodes);
          // Text prompt nodes are always ready (user input)
          state.updateNodeStatus(node.id, "success");
          break;

        case NodeType.LLM_INVOCATION:
          // Reset connected output nodes before starting LLM execution
          this.resetConnectedOutputNodes(node.id, edges, nodes);
          await this.executeLLMNode(node, edges, nodes);
          break;

        case NodeType.OUTPUT:
          // Output nodes primarily receive content via streaming from LLM nodes
          // Only update if connected to non-LLM inputs (like text nodes)
          const inputText = this.getInputText(node.id, edges, nodes);
          const inputNodes = this.getInputNodes(node.id, edges, nodes);
          const hasLLMInput = inputNodes.some(
            (n) => n.type === NodeType.LLM_INVOCATION
          );

          if (!hasLLMInput) {
            // Only update content and status if not connected to LLM
            if (inputText.trim()) {
              state.updateNodeDataDuringExecution(
                node.id,
                {
                  content: inputText,
                  isStreaming: false,
                }
              );
            }
            state.updateNodeStatus(node.id, "success");
          }
          // If connected to LLM, status will be managed by LLM streaming callbacks
          break;

        default:
          throw new Error(`Unknown node type: ${node.type}`);
      }

      state.markNodeCompleted(node.id);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      state.markNodeError(node.id, errorMessage);
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

    // Find connected output nodes to stream to - GET ALL OUTPUT NODES
    const outputNodes = this.getOutputNodes(node.id, edges, nodes);
    const connectedOutputNodes = outputNodes.filter(
      (n) => n.type === NodeType.OUTPUT
    );

    const params: LLMParams = {
      model: nodeData.model,
      temperature: nodeData.temperature,
      maxTokens: nodeData.maxTokens,
      systemPrompt: nodeData.systemPrompt,
    };

    return new Promise((resolve, reject) => {
      LLMService.streamCompletion(inputText, params, {
        onStart: () => {
          // Stream to ALL connected output nodes
          connectedOutputNodes.forEach((outputNode) => {
            (useStore.getState() as any).updateNodeDataDuringExecution(
              outputNode.id,
              {
                isStreaming: true,
                streamedContent: "",
                tokenCount: undefined, // Clear any previous token count
              }
            );
            (useStore.getState() as any).updateNodeStatus(
              outputNode.id,
              "running"
            );
          });
        },

        onContent: (content: string) => {
          // Broadcast identical content to ALL connected output nodes
          connectedOutputNodes.forEach((outputNode) => {
            (useStore.getState() as any).updateNodeDataDuringExecution(
              outputNode.id,
              {
                streamedContent: content,
              }
            );
          });
        },

        onComplete: (finalContent: string, tokenCount?: number) => {
          (useStore.getState() as any).updateNodeStatus(node.id, "success");

          // Update ALL connected output nodes with final content
          connectedOutputNodes.forEach((outputNode) => {
            (useStore.getState() as any).updateNodeDataDuringExecution(
              outputNode.id,
              {
                content: finalContent,
                isStreaming: false,
                streamedContent: "",
                tokenCount,
              }
            );
            (useStore.getState() as any).updateNodeStatus(
              outputNode.id,
              "success"
            );
          });

          resolve();
        },

        onError: (error: string) => {
          // Mark LLM node as error first
          (useStore.getState() as any).updateNodeStatus(
            node.id,
            "error",
            error
          );

          // Propagate error to ALL connected output nodes
          connectedOutputNodes.forEach((outputNode) => {
            (useStore.getState() as any).updateNodeDataDuringExecution(
              outputNode.id,
              {
                isStreaming: false,
                streamedContent: "",
              }
            );
            (useStore.getState() as any).updateNodeStatus(
              outputNode.id,
              "error",
              `LLM error: ${error}`
            );
          });
          reject(new Error(`LLM invocation failed: ${error}`));
        },
      });
    });
  }

  // Execute the entire workflow
  async executeWorkflow(): Promise<void> {
    const state = useStore.getState() as any;
    const { edges } = state;
    let { nodes } = state;

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
      let nodesToExecute = [...nodes];

      while (nodesToExecute.length > 0) {
        // Fetch fresh node state from store to get updated statuses
        const currentState = useStore.getState() as any;
        const currentNodes = currentState.nodes;

        const readyNodes = nodesToExecute.filter((node) => {
          if (executedNodes.has(node.id)) return false;

          // Start nodes can always execute
          if (node.type === NodeType.START) return true;

          // Other nodes need their inputs ready - use current node state
          const isReady = this.areInputsReady(node.id, edges, currentNodes);

          // Debug logging to help verify the fix
          if (process.env.NODE_ENV === 'development') {
            const inputNodes = this.getInputNodes(node.id, edges, currentNodes);
            const inputStatuses = inputNodes.map(n => `${n.type}:${(n.data as any).status}`).join(', ');
            console.log(`Node ${node.id} (${node.type}) ready check: ${isReady} | Input statuses: [${inputStatuses}]`);
          }

          return isReady;
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

            // Use current node state for execution
            const currentState = useStore.getState() as any;
            const currentNodes = currentState.nodes;
            await this.executeNode(node, edges, currentNodes);
            executedNodes.add(node.id);
          })
        );

        // Remove executed nodes from the queue - use fresh node list
        const freshState = useStore.getState() as any;
        nodesToExecute = freshState.nodes.filter((node: any) => !executedNodes.has(node.id));
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
