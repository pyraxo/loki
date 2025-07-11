import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, RefreshCw, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AdvancedTab() {
  const { exportSettings, importSettings, resetSettings } = useStore();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleExportSettings = async () => {
    setIsExporting(true);
    try {
      const settingsData = await exportSettings();

      // Create and download file
      const blob = new Blob([settingsData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `loki-settings-${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export settings:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportSettings = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        setIsImporting(true);
        try {
          const text = await file.text();
          await importSettings(text);
        } catch (error) {
          console.error("Failed to import settings:", error);
        } finally {
          setIsImporting(false);
        }
      }
    };
    input.click();
  };

  const handleResetSettings = async () => {
    if (
      confirm(
        "Are you sure you want to reset all settings to defaults? This cannot be undone."
      )
    ) {
      setIsResetting(true);
      try {
        await resetSettings();
      } catch (error) {
        console.error("Failed to reset settings:", error);
      } finally {
        setIsResetting(false);
      }
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Export & Import</CardTitle>
            <CardDescription>
              Backup and restore your settings. API keys are not included for
              security.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleExportSettings}
                disabled={isExporting}
                className="flex-1"
              >
                {isExporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Export Settings
              </Button>

              <Button
                variant="outline"
                onClick={handleImportSettings}
                disabled={isImporting}
                className="flex-1"
              >
                {isImporting ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Import Settings
              </Button>
            </div>

            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
              <strong>Note:</strong> Exported settings do not include API keys
              for security reasons. You will need to re-enter your API keys
              after importing settings.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Danger Zone
            </CardTitle>
            <CardDescription>
              Irreversible actions that affect all your settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="pr-2">
                  <div className="text-sm font-medium">Reset All Settings</div>
                  <div className="text-xs text-muted-foreground">
                    Reset all settings to their default values. This will also
                    clear all API keys.
                  </div>
                </div>
                <Button
                  variant="destructive"
                  onClick={handleResetSettings}
                  disabled={isResetting}
                >
                  {isResetting ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : null}
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Application Info</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Version:</span>
                <Badge variant="outline">0.1.0</Badge>
              </div>
              <div className="flex justify-between">
                <span>Settings Format:</span>
                <Badge variant="outline">v1.0.0</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
