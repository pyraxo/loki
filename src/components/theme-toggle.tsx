import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sun, Moon, Monitor } from "lucide-react";
import { useStore } from "@/lib/store";
import { useResolvedTheme } from "@/hooks/use-theme-sync";
import { type ThemeMode } from "@/types/settings";

/**
 * ThemeToggle Component
 *
 * Beautiful theme toggle button that cycles through light → dark → system modes.
 * Features:
 * - Appropriate icons for each theme state
 * - Smooth transitions and hover effects
 * - Accessible with tooltips and keyboard navigation
 * - Integrates with both store settings and next-themes
 */
export default function ThemeToggle() {
  const { setTheme } = useStore();
  const { theme, resolvedTheme, isSystemMode } = useResolvedTheme();

  // Define theme cycle and display properties
  const themes: Array<{
    name: ThemeMode;
    icon: typeof Sun;
    label: string;
    description: string;
  }> = [
    {
      name: "light",
      icon: Sun,
      label: "Light",
      description: "Switch to light mode",
    },
    {
      name: "dark",
      icon: Moon,
      label: "Dark",
      description: "Switch to dark mode",
    },
    {
      name: "system",
      icon: Monitor,
      label: "System",
      description: "Use system theme",
    },
  ];

  // Get current theme info
  const currentThemeIndex = themes.findIndex((t) => t.name === theme);
  const currentTheme = themes[currentThemeIndex] || themes[2]; // Default to system

  // Get next theme in cycle
  const getNextTheme = (): ThemeMode => {
    const nextIndex = (currentThemeIndex + 1) % themes.length;
    return themes[nextIndex].name;
  };

  // Handle theme toggle
  const handleToggle = async () => {
    try {
      const nextTheme = getNextTheme();
      await setTheme(nextTheme);
      console.log(`Theme toggled: ${theme} → ${nextTheme}`);
    } catch (error) {
      console.error("Failed to toggle theme:", error);
    }
  };

  // Get tooltip content based on current state
  const getTooltipContent = () => {
    const nextTheme = getNextTheme();
    const nextThemeInfo = themes.find((t) => t.name === nextTheme);

    if (isSystemMode) {
      return `System (${resolvedTheme}). Click for ${nextThemeInfo?.label?.toLowerCase()}`;
    }

    return `${
      currentTheme.label
    } mode. Click for ${nextThemeInfo?.label?.toLowerCase()}`;
  };

  // Get current icon with proper styling
  const IconComponent = currentTheme.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground transition-all duration-200"
          aria-label={`Current theme: ${currentTheme.label}. ${currentTheme.description}`}
        >
          <IconComponent
            className="h-4 w-4 transition-all duration-300 hover:scale-110"
            aria-hidden="true"
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs" sideOffset={4}>
        {getTooltipContent()}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Utility function to get theme icon (for use in other components)
 */
export function getThemeIcon(theme: ThemeMode) {
  const iconMap = {
    light: Sun,
    dark: Moon,
    system: Monitor,
  };

  return iconMap[theme] || Monitor;
}

/**
 * Utility function to get theme display name
 */
export function getThemeDisplayName(theme: ThemeMode): string {
  const nameMap = {
    light: "Light",
    dark: "Dark",
    system: "System",
  };

  return nameMap[theme] || "System";
}
