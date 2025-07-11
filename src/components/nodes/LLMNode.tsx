import { type NodeProps } from "@xyflow/react";
import { type LLMInvocationNode } from "@/types/nodes";
import { useStore } from "@/lib/store";
import { NodeWrapper } from "@/components/nodes/BaseNode";
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

export function LLMInvocationNode({ data, id }: NodeProps<LLMInvocationNode>) {
  const { updateNodeData } = useStore();

  const handleModelChange = (model: string) => {
    updateNodeData(id, {
      model: model as any,
    });
  };

  const handleTemperatureChange = (temperature: number[]) => {
    updateNodeData(id, {
      temperature: temperature[0],
    });
  };

  const handleMaxTokensChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    updateNodeData(id, {
      maxTokens: Math.min(Math.max(value, 1), 4000),
    });
  };

  return (
    <NodeWrapper
      data={data}
      icon="🤖"
      title="LLM Invocation"
      width="w-80"
      minHeight="min-h-[280px]"
    >
      <div className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Model</Label>
          <Select value={data.model} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4">GPT-4</SelectItem>
              <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
              <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
              <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Temperature Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs font-medium">Temperature</Label>
            <span className="text-xs text-muted-foreground">
              {data.temperature.toFixed(1)}
            </span>
          </div>
          <Slider
            value={[data.temperature]}
            onValueChange={handleTemperatureChange}
            max={2}
            min={0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Focused</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Max Tokens</Label>
          <Input
            type="number"
            value={data.maxTokens}
            onChange={handleMaxTokensChange}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            min={1}
            max={4000}
            className="w-full"
          />
        </div>
      </div>
    </NodeWrapper>
  );
}
