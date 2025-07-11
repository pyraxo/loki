import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useStore } from "@/lib/store";

export default function PreferencesTab() {
  const { settings, updateSettings } = useStore();

  const handleAutoSaveChange = async (value: number) => {
    await updateSettings({ autoSaveInterval: value });
  };

  const handleTemperatureChange = async (value: number[]) => {
    await updateSettings({ defaultTemperature: value[0] });
  };

  const handleMaxTokensChange = async (value: string) => {
    const tokens = parseInt(value);
    if (!isNaN(tokens)) {
      await updateSettings({ defaultMaxTokens: tokens });
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Auto-save</CardTitle>
          <CardDescription>
            Configure automatic saving of sessions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Auto-save interval: {settings.autoSaveInterval}s</Label>
            <Slider
              value={[settings.autoSaveInterval]}
              onValueChange={([value]) => handleAutoSaveChange(value)}
              min={5}
              max={300}
              step={5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Model Parameters</CardTitle>
          <CardDescription>
            Set default values for new LLM nodes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Temperature: {settings.defaultTemperature}</Label>
            <Slider
              value={[settings.defaultTemperature]}
              onValueChange={handleTemperatureChange}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-tokens">Max Tokens</Label>
            <Input
              id="max-tokens"
              type="number"
              min="1"
              max="4000"
              value={settings.defaultMaxTokens}
              onChange={(e) => handleMaxTokensChange(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
