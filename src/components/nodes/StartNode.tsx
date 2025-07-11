import { Button } from "@/components/ui/button";
import { Square, Play } from "lucide-react";
import { NodeProps } from "@xyflow/react";
import { StartNodeData } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { BaseNode } from "@/components/nodes/BaseNode";

// Start Node Class
class StartNodeClass extends BaseNode<StartNodeData> {
  private workflow: any;
  private stopWorkflow: () => void;

  constructor(
    data: StartNodeData,
    updateNodeData: (id: string, updates: Partial<StartNodeData>) => void,
    workflow: any,
    stopWorkflow: () => void
  ) {
    super(data, updateNodeData);
    this.workflow = workflow;
    this.stopWorkflow = stopWorkflow;
  }

  protected getNodeIcon(): string {
    return "🚀";
  }

  protected getNodeTitle(): string {
    return "Start";
  }

  protected getNodeWidth(): string {
    return "w-64";
  }

  protected getMinHeight(): string {
    return "min-h-[120px]";
  }

  protected getStatusColor(): string {
    return "border-green-500";
  }

  protected getHeaderBg(): string {
    return "bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200";
  }

  protected renderTargetHandle(): JSX.Element | null {
    return null; // Start node doesn't have target handle
  }

  private handleRun = async () => {
    if (this.workflow.isRunning) {
      this.stopWorkflow();
    } else {
      try {
        const { executionEngine } = await import("@/lib/execution-engine");
        await executionEngine.executeWorkflow();
      } catch (error) {
        console.error("Workflow execution failed:", error);
        this.stopWorkflow();
      }
    }
  };

  protected renderContent(): JSX.Element {
    return (
      <>
        <div className="text-xs text-muted-foreground mb-3">
          {this.data.workflowName}
        </div>
        <Button
          onClick={this.handleRun}
          size="sm"
          className="w-full"
          variant={this.workflow.isRunning ? "destructive" : "default"}
        >
          {this.workflow.isRunning ? (
            <>
              <Square className="w-3 h-3 mr-1" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Run All
            </>
          )}
        </Button>
      </>
    );
  }
}

// React Component Wrapper for Start Node
export function StartNode({ data }: NodeProps) {
  const nodeData = data as StartNodeData;
  const { workflow, stopWorkflow, updateNodeData } = useStore();

  const nodeInstance = new StartNodeClass(
    nodeData,
    updateNodeData,
    workflow,
    stopWorkflow
  );

  return nodeInstance.render();
}
