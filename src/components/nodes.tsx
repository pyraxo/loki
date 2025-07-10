import { useState } from "react";
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

// Base Node Class
abstract class BaseNode<T = any> {
  protected data: T;
  protected updateNodeData: (id: string, updates: Partial<T>) => void;

  constructor(
    data: T,
    updateNodeData: (id: string, updates: Partial<T>) => void
  ) {
    this.data = data;
    this.updateNodeData = updateNodeData;
  }

  // Abstract methods that child classes must implement
  protected abstract getNodeIcon(): string;
  protected abstract getNodeTitle(): string;
  protected abstract renderContent(): JSX.Element;
  protected abstract getNodeWidth(): string;
  protected abstract getMinHeight(): string;

  // Common styling methods
  protected getStatusColor(): string {
    switch ((this.data as any).status) {
      case "running":
        return "border-blue-500";
      case "success":
        return "border-green-500";
      case "error":
        return "border-red-500";
      default:
        return "border-gray-300";
    }
  }

  protected getHeaderBg(): string {
    switch ((this.data as any).status) {
      case "running":
        return "bg-gradient-to-r from-blue-50 to-blue-100 border-b border-blue-200";
      case "success":
        return "bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200";
      case "error":
        return "bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200";
    }
  }

  // Common header rendering
  protected renderHeader(): JSX.Element {
    const nodeData = this.data as any;
    return (
      <CardHeader
        className={`pb-2 pt-6 px-4 cursor-move border-b-1 rounded-t-lg node-drag`}
      >
        <CardTitle className="text-sm flex items-center justify-between">
          {this.getNodeIcon()} {this.getNodeTitle()}
          <Badge
            variant={nodeData.status === "running" ? "default" : "secondary"}
          >
            {this.renderStatusBadge()}
          </Badge>
        </CardTitle>
      </CardHeader>
    );
  }

  // Status badge rendering (can be overridden)
  protected renderStatusBadge(): JSX.Element | string {
    const nodeData = this.data as any;
    return nodeData.status === "running" ? (
      <>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Running
      </>
    ) : (
      nodeData.status
    );
  }

  // Handle rendering methods
  protected renderTargetHandle(): JSX.Element | null {
    return <Handle type="target" position={Position.Top} />;
  }

  protected renderSourceHandle(): JSX.Element | null {
    return <Handle type="source" position={Position.Bottom} />;
  }

  // Main render method
  public render(): JSX.Element {
    return (
      <Card
        className={`${this.getNodeWidth()} ${this.getMinHeight()} ${this.getStatusColor()} border-2 cursor-default pt-0`}
      >
        {this.renderTargetHandle()}
        {this.renderHeader()}
        <CardContent>{this.renderContent()}</CardContent>
        {this.renderSourceHandle()}
      </Card>
    );
  }
}

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
function StartNode({ data }: NodeProps) {
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

// Text Prompt Node Class
class TextPromptNodeClass extends BaseNode<TextPromptNodeData> {
  private localText: string;
  private setLocalText: (text: string) => void;

  constructor(
    data: TextPromptNodeData,
    updateNodeData: (id: string, updates: Partial<TextPromptNodeData>) => void,
    localText: string,
    setLocalText: (text: string) => void
  ) {
    super(data, updateNodeData);
    this.localText = localText;
    this.setLocalText = setLocalText;
  }

  protected getNodeIcon(): string {
    return "📝";
  }

  protected getNodeTitle(): string {
    return "Text Prompt";
  }

  protected getNodeWidth(): string {
    return "w-80";
  }

  protected getMinHeight(): string {
    return "min-h-[200px]";
  }

  private handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    this.setLocalText(newText);
    this.updateNodeData(this.data.id, {
      text: newText,
      characterCount: newText.length,
    });
  };

  protected renderContent(): JSX.Element {
    return (
      <>
        <Textarea
          value={this.localText}
          onChange={this.handleTextChange}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder="Enter your prompt here..."
          className="min-h-[100px] resize-none"
        />
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>{this.data.characterCount || 0} characters</span>
          {this.data.error && (
            <span className="text-red-500">Error: {this.data.error}</span>
          )}
        </div>
      </>
    );
  }
}

// React Component Wrapper for Text Prompt Node
function TextPromptNode({ data }: NodeProps) {
  const nodeData = data as TextPromptNodeData;
  const { updateNodeData } = useStore();
  const [localText, setLocalText] = useState(nodeData.text);

  const nodeInstance = new TextPromptNodeClass(
    nodeData,
    updateNodeData,
    localText,
    setLocalText
  );

  return nodeInstance.render();
}

// LLM Invocation Node Class
class LLMInvocationNodeClass extends BaseNode<LLMInvocationNodeData> {
  protected getNodeIcon(): string {
    return "🤖";
  }

  protected getNodeTitle(): string {
    return "LLM Invocation";
  }

  protected getNodeWidth(): string {
    return "w-80";
  }

  protected getMinHeight(): string {
    return "min-h-[250px]";
  }

  private handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    this.updateNodeData(this.data.id, { model: e.target.value as any });
  };

  private handleTempChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.updateNodeData(this.data.id, {
      temperature: parseFloat(e.target.value),
    });
  };

  private handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.updateNodeData(this.data.id, { maxTokens: parseInt(e.target.value) });
  };

  protected renderContent(): JSX.Element {
    return (
      <div className="space-y-3">
        <div>
          <label className="text-xs font-medium">Model</label>
          <select
            value={this.data.model}
            onChange={this.handleModelChange}
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
            Temperature: {this.data.temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={this.data.temperature}
            onChange={this.handleTempChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full mt-1"
          />
        </div>

        <div>
          <label className="text-xs font-medium">Max Tokens</label>
          <input
            type="number"
            value={this.data.maxTokens}
            onChange={this.handleMaxTokensChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full mt-1 px-2 py-1 text-sm border rounded"
            min="1"
            max="4000"
          />
        </div>

        {this.data.error && (
          <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
            Error: {this.data.error}
          </div>
        )}
      </div>
    );
  }
}

// React Component Wrapper for LLM Invocation Node
function LLMInvocationNode({ data }: NodeProps) {
  const nodeData = data as LLMInvocationNodeData;
  const { updateNodeData } = useStore();

  const nodeInstance = new LLMInvocationNodeClass(nodeData, updateNodeData);
  return nodeInstance.render();
}

// Output Node Class
class OutputNodeClass extends BaseNode<OutputNodeData> {
  protected getNodeIcon(): string {
    return "📄";
  }

  protected getNodeTitle(): string {
    return "Output";
  }

  protected getNodeWidth(): string {
    return "w-96";
  }

  protected getMinHeight(): string {
    return "min-h-[300px]";
  }

  protected renderStatusBadge(): JSX.Element | string {
    return this.data.isStreaming ? (
      <>
        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
        Streaming
      </>
    ) : (
      this.data.status
    );
  }

  protected renderSourceHandle(): JSX.Element | null {
    return null; // Output node doesn't have source handle
  }

  protected renderContent(): JSX.Element {
    return (
      <>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded min-h-[200px] text-sm">
          {this.data.isStreaming && this.data.streamedContent ? (
            <div className="whitespace-pre-wrap">
              {this.data.streamedContent}
              <span className="animate-pulse">|</span>
            </div>
          ) : this.data.content ? (
            <div className="whitespace-pre-wrap">{this.data.content}</div>
          ) : (
            <div className="text-muted-foreground italic">
              No output yet. Run the workflow to see results.
            </div>
          )}
        </div>

        {this.data.tokenCount && (
          <div className="mt-2 text-xs text-muted-foreground">
            Tokens: {this.data.tokenCount}
          </div>
        )}

        {this.data.error && (
          <div className="mt-2 text-xs text-red-500 bg-red-50 p-2 rounded">
            Error: {this.data.error}
          </div>
        )}
      </>
    );
  }
}

// React Component Wrapper for Output Node
function OutputNode({ data }: NodeProps) {
  const nodeData = data as OutputNodeData;
  const { updateNodeData } = useStore();

  const nodeInstance = new OutputNodeClass(nodeData, updateNodeData);
  return nodeInstance.render();
}

export const nodeTypes = {
  [NodeType.START]: StartNode,
  [NodeType.TEXT_PROMPT]: TextPromptNode,
  [NodeType.LLM_INVOCATION]: LLMInvocationNode,
  [NodeType.OUTPUT]: OutputNode,
};

/*
Example: Creating a new node type using inheritance

// Custom Timer Node Class
class TimerNodeClass extends BaseNode<TimerNodeData> {
  protected getNodeIcon(): string {
    return "⏰";
  }

  protected getNodeTitle(): string {
    return "Timer";
  }

  protected getNodeWidth(): string {
    return "w-64";
  }

  protected getMinHeight(): string {
    return "min-h-[150px]";
  }

  protected renderContent(): JSX.Element {
    return (
      <div>
        <label>Delay (seconds)</label>
        <input 
          type="number" 
          value={this.data.delay}
          onChange={(e) => this.updateNodeData(this.data.id, { delay: parseInt(e.target.value) })}
        />
      </div>
    );
  }
}

// React Component Wrapper
function TimerNode({ data }: NodeProps) {
  const nodeData = data as TimerNodeData;
  const { updateNodeData } = useStore();
  const nodeInstance = new TimerNodeClass(nodeData, updateNodeData);
  return nodeInstance.render();
}

Benefits of this OOP approach:
- ✅ All common functionality (styling, handles, headers) is inherited from BaseNode
- ✅ Only need to implement node-specific logic (icon, title, dimensions, content)
- ✅ Consistent look and behavior across all nodes
- ✅ Easy to extend and customize specific methods when needed
- ✅ Type safety with generics for node data
- ✅ Modular and reusable architecture
*/
