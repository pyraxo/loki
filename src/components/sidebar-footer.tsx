import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store";
import { PROVIDER_METADATA } from "@/types/settings";

export default function SidebarFooter() {
  const { openSettingsDialog, settings, settingsLoaded } = useStore();

  const getProviderStatus = () => {
    if (!settingsLoaded) {
      return "text-muted-foreground"; // Gray when loading
    }

    // Check if any provider is enabled and has configuration
    const enabledProviders = Object.entries(settings.providers).filter(
      ([_, config]) => config.enabled
    );

    if (enabledProviders.length === 0) {
      return "text-orange-500"; // Orange when no providers enabled
    }

    // For now, assume configured if enabled (will be enhanced later with actual connectivity checks)
    return "text-green-500"; // Green when at least one provider is enabled
  };

  const getStatusDot = () => {
    const statusClass = getProviderStatus();
    return `inline-block w-2 h-2 rounded-full ${statusClass.replace(
      "text-",
      "bg-"
    )}`;
  };

  const getProviderCountText = () => {
    if (!settingsLoaded) return "Loading...";

    const enabledCount = Object.values(settings.providers).filter(
      (config) => config.enabled
    ).length;

    if (enabledCount === 0) return "No providers";
    if (enabledCount === 1) return "1 provider";
    return `${enabledCount} providers`;
  };

  return (
    <div className="border-t p-3 space-y-2">
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start text-muted-foreground hover:text-foreground"
        onClick={() => openSettingsDialog()}
      >
        <Settings className="h-4 w-4 mr-2" />
        Settings
      </Button>

      <div className="flex items-center justify-between text-xs text-muted-foreground px-2">
        <span className="capitalize">{settings.theme} theme</span>
        <div className="flex items-center gap-1">
          <span className={getStatusDot()} />
          <span>{getProviderCountText()}</span>
        </div>
      </div>
    </div>
  );
}
