import { Button } from "@/components/ui/button";
import { Square, Play } from "lucide-react";
import { type NodeProps } from "@xyflow/react";
import { type StartNode } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { NodeWrapper } from "@/components/nodes/BaseNode";
import { executionEngine } from "@/lib/execution-engine";

export function StartNode({ data }: NodeProps<StartNode>) {
  const { workflow, startWorkflow, stopWorkflow } = useStore();

  const handleRunClick = async () => {
    if (workflow.isRunning) {
      executionEngine.stopExecution();
      stopWorkflow();
    } else {
      try {
        startWorkflow();
        await executionEngine.executeWorkflow();
      } catch (error) {
        console.error("Workflow execution failed:", error);
      }
    }
  };

  return (
    <NodeWrapper
      data={data}
      icon="🚀"
      title="Start"
      width="w-64"
      minHeight="min-h-[150px]"
      hasTargetHandle={false}
    >
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground">
            Workflow Name
          </label>
          <p className="text-sm font-medium mt-1">{data.workflowName}</p>
        </div>

        <Button
          onClick={handleRunClick}
          className="w-full"
          variant={workflow.isRunning ? "destructive" : "default"}
          size="sm"
        >
          {workflow.isRunning ? (
            <>
              <Square className="w-3 h-3 mr-2" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-2" />
              Run All
            </>
          )}
        </Button>
      </div>
    </NodeWrapper>
  );
}
