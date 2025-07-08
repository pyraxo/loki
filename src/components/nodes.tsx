import { useState, useCallback } from "react";
import { Card, CardTitle, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Loader2 } from "lucide-react";
import { type NodeProps, Handle, Position } from "@xyflow/react";
import { useStore } from "@/lib/store";
import {
  type TextPromptNodeData,
  type LLMInvocationNodeData,
  type OutputNodeData,
  type StartNodeData,
  NodeType,
} from "@/types/nodes";

// Start Node Component
function StartNode({ data }: NodeProps) {
  const nodeData = data as StartNodeData;
  const { workflow, startWorkflow, stopWorkflow } = useStore();

  const handleRun = useCallback(async () => {
    if (workflow.isRunning) {
      stopWorkflow();
    } else {
      try {
        const { executionEngine } = await import("@/lib/execution-engine");
        await executionEngine.executeWorkflow();
      } catch (error) {
        console.error("Workflow execution failed:", error);
        stopWorkflow();
      }
    }
  }, [workflow.isRunning, startWorkflow, stopWorkflow]);

  return (
    <Card className="w-64 min-h-[120px] border-2 border-green-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          🚀 Start
          <Badge
            variant={nodeData.status === "running" ? "default" : "secondary"}
          >
            {nodeData.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-3">
          {nodeData.workflowName}
        </div>
        <Button
          onClick={handleRun}
          size="sm"
          className="w-full"
          variant={workflow.isRunning ? "destructive" : "default"}
        >
          {workflow.isRunning ? (
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
      </CardContent>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}

// Text Prompt Node Component
function TextPromptNode({ data }: NodeProps) {
  const nodeData = data as TextPromptNodeData;
  const { updateNodeData } = useStore();
  const [localText, setLocalText] = useState(nodeData.text);

  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newText = e.target.value;
      setLocalText(newText);
      updateNodeData(nodeData.id, {
        text: newText,
        characterCount: newText.length,
      });
    },
    [nodeData.id, updateNodeData]
  );

  const getStatusColor = () => {
    switch (nodeData.status) {
      case "running":
        return "border-blue-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card className={`w-80 min-h-[200px] ${getStatusColor()} border-2`}>
      <Handle type="target" position={Position.Top} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          📝 Text Prompt
          <Badge
            variant={nodeData.status === "running" ? "default" : "secondary"}
          >
            {nodeData.status}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          value={localText}
          onChange={handleTextChange}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Enter your prompt here..."
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{nodeData.characterCount || 0} characters</span>
          {nodeData.error && (
            <span className="text-red-500">Error: {nodeData.error}</span>
          )}
        </div>
      </CardContent>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}

// LLM Invocation Node Component
function LLMInvocationNode({ data }: NodeProps) {
  const nodeData = data as LLMInvocationNodeData;
  const { updateNodeData } = useStore();

  const handleModelChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateNodeData(nodeData.id, { model: e.target.value as any });
    },
    [nodeData.id, updateNodeData]
  );

  const handleTempChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateNodeData(nodeData.id, { temperature: parseFloat(e.target.value) });
    },
    [nodeData.id, updateNodeData]
  );

  const getStatusColor = () => {
    switch (nodeData.status) {
      case "running":
        return "border-blue-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card className={`w-80 min-h-[250px] ${getStatusColor()} border-2`}>
      <Handle type="target" position={Position.Top} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          🤖 LLM Invocation
          <Badge
            variant={nodeData.status === "running" ? "default" : "secondary"}
          >
            {nodeData.status === "running" ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Running
              </>
            ) : (
              nodeData.status
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-medium">Model</label>
          <select
            value={nodeData.model}
            onChange={handleModelChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full mt-1 px-2 py-1 text-sm border rounded"
          >
            <option value="gpt-4">GPT-4</option>
            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            <option value="claude-3-haiku">Claude 3 Haiku</option>
            <option value="claude-3-sonnet">Claude 3 Sonnet</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium">
            Temperature: {nodeData.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={nodeData.temperature}
            onChange={handleTempChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-medium">Max Tokens</label>
          <input
            type="number"
            value={nodeData.maxTokens}
            onChange={(e) =>
              updateNodeData(nodeData.id, {
                maxTokens: parseInt(e.target.value),
              })
            }
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full mt-1 px-2 py-1 text-sm border rounded"
            min="1"
            max="4000"
          />
        </div>

        {nodeData.error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
            Error: {nodeData.error}
          </div>
        )}
      </CardContent>
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
}

// Output/Viewer Node Component
function OutputNode({ data }: NodeProps) {
  const nodeData = data as OutputNodeData;

  const getStatusColor = () => {
    switch (nodeData.status) {
      case "running":
        return "border-blue-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  };

  return (
    <Card className={`w-96 min-h-[300px] ${getStatusColor()} border-2`}>
      <Handle type="target" position={Position.Top} />
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          📄 Output
          <Badge
            variant={nodeData.status === "running" ? "default" : "secondary"}
          >
            {nodeData.isStreaming ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Streaming
              </>
            ) : (
              nodeData.status
            )}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded min-h-[200px] text-sm">
          {nodeData.isStreaming && nodeData.streamedContent ? (
            <div className="whitespace-pre-wrap">
              {nodeData.streamedContent}
              <span className="animate-pulse">|</span>
            </div>
          ) : nodeData.content ? (
            <div className="whitespace-pre-wrap">{nodeData.content}</div>
          ) : (
            <div className="text-muted-foreground italic">
              No output yet. Run the workflow to see results.
            </div>
          )}
        </div>

        {nodeData.tokenCount && (
          <div className="mt-2 text-xs text-muted-foreground">
            Tokens: {nodeData.tokenCount}
          </div>
        )}

        {nodeData.error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            Error: {nodeData.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.TEXT_PROMPT]: TextPromptNode,
  [NodeType.LLM_INVOCATION]: LLMInvocationNode,
  [NodeType.OUTPUT]: OutputNode,
};
