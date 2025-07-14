import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Button } from "@/components/ui/button";
import { executionEngine } from "@/lib/execution-engine";
import { useStore } from "@/lib/store";
import { type StartNode } from "@/types/nodes";
import { type NodeProps } from "@xyflow/react";
import { Play, Square } from "lucide-react";

export function StartNode({ data, selected }: NodeProps<StartNode>) {
  const { workflow, startWorkflow, stopWorkflow, resetWorkflow } = useStore();

  const handleRunClick = async () => {
    if (workflow.isRunning) {
      executionEngine.stopExecution();
      stopWorkflow();
    } else {
      try {
        // Reset all node statuses before starting workflow
        resetWorkflow();
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
      minWidth={240}
      minHeight={240}
      hasTargetHandle={false}
      selected={selected}
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
