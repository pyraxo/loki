import { NodeWrapper } from "@/components/nodes/BaseNode";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useStore } from "@/lib/store";
import { type LLMInvocationNode } from "@/types/nodes";
import { PROVIDER_METADATA, type LLMProvider } from "@/types/settings";
import { type NodeProps } from "@xyflow/react";

export function LLMInvocationNode({
  data,
  id,
  selected,
}: NodeProps<LLMInvocationNode>) {
  const { updateNodeData, settings } = useStore();

  // Get all models from enabled providers
  const getAvailableModels = () => {
    const availableModels: Array<{
      value: string;
      label: string;
      provider: string;
    }> = [];

    Object.entries(settings.providers).forEach(([provider, config]) => {
      if (config.enabled) {
        const providerKey = provider as LLMProvider;
        const metadata = PROVIDER_METADATA[providerKey];

        metadata.models.forEach((model) => {
          availableModels.push({
            value: model,
            label: `${model} (${metadata.name})`,
            provider: providerKey,
          });
        });
      }
    });

    return availableModels;
  };

  const availableModels = getAvailableModels();

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
      maxTokens: Math.min(Math.max(value, 1), 10000),
    });
  };

  return (
    <NodeWrapper
      data={data}
      icon="🤖"
      title="LLM Invocation"
      minWidth={300}
      minHeight={320}
      selected={selected}
    >
      <div className="space-y-4">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Model</Label>
          <Select value={data.model} onValueChange={handleModelChange}>
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  availableModels.length > 0
                    ? "Select model"
                    : "No enabled providers"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <SelectItem key={model.value} value={model.value}>
                    {model.label}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="" disabled>
                  Enable providers in Settings to see models
                </SelectItem>
              )}
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
            max={10000}
            className="w-full"
          />
        </div>
      </div>
    </NodeWrapper>
  );
}
