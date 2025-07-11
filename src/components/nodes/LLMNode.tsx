import { NodeProps } from "@xyflow/react";
import { LLMInvocationNodeData } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { BaseNode } from "@/components/nodes/BaseNode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  private handleModelChange = (value: string) => {
    this.updateNodeData(this.data.id, { model: value as any });
  };

  private handleTempChange = (value: number[]) => {
    this.updateNodeData(this.data.id, {
      temperature: value[0],
    });
  };

  private handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.updateNodeData(this.data.id, { maxTokens: parseInt(e.target.value) });
  };

  protected renderContent(): JSX.Element {
    return (
      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs font-medium">Model</Label>
          <Select
            value={this.data.model}
            onValueChange={this.handleModelChange}
          >
            <SelectTrigger
              className="w-full"
              onMouseDown={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">
            Temperature: {this.data.temperature}
          </Label>
          <Slider
            value={[this.data.temperature]}
            onValueChange={this.handleTempChange}
            min={0}
            max={2}
            step={0.1}
            className="w-full"
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium">Max Tokens</Label>
          <Input
            type="number"
            value={this.data.maxTokens}
            onChange={this.handleMaxTokensChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="w-full"
            min="1"
            max="4000"
          />
        </div>

        {this.data.error && (
          <Alert variant="destructive">
            <AlertDescription className="text-xs">
              Error: {this.data.error}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }
}

// React Component Wrapper for LLM Invocation Node
export function LLMInvocationNode({ data }: NodeProps) {
  const nodeData = data as LLMInvocationNodeData;
  const { updateNodeData } = useStore();

  const nodeInstance = new LLMInvocationNodeClass(nodeData, updateNodeData);
  return nodeInstance.render();
}
