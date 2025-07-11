import { useEffect } from "react";
import { useTheme } from "next-themes";
import { useStore } from "@/lib/store";
import { themeService } from "@/lib/theme-service";
import { type ThemeMode } from "@/types/settings";

/**
 * useThemeSync Hook
 *
 * Provides unidirectional synchronization from Zustand store to next-themes:
 * - Syncs theme changes from store to next-themes (ONE WAY ONLY)
 * - Handles system theme detection
 * - Initializes theme on app startup
 */
export function useThemeSync() {
  const { setTheme: setNextTheme } = useTheme();
  const { settings, settingsLoaded } = useStore();

  // Initialize theme system once settings are loaded (ONLY ONCE)
  useEffect(() => {
    if (!settingsLoaded) return;

    const initializeTheme = async () => {
      try {
        // Set next-themes to match store settings
        setNextTheme(settings.theme);
        console.log(`Theme initialized: ${settings.theme}`);
      } catch (error) {
        console.error("Failed to initialize theme:", error);
      }
    };

    initializeTheme();
  }, [settingsLoaded]); // Only depend on settingsLoaded, not theme values

  // Sync theme changes from store to next-themes (ONE WAY ONLY)
  useEffect(() => {
    if (!settingsLoaded) return;

    // Update next-themes when store settings change
    setNextTheme(settings.theme);
    console.log(`Theme synced from store: ${settings.theme}`);
  }, [settings.theme, settingsLoaded]); // Only depend on store theme, not next-themes

  // Return current theme info for debugging/inspection
  return {
    settingsTheme: settings.theme,
    isInitialized: settingsLoaded,
  };
}

/**
 * Hook to get current resolved theme (handles system theme resolution)
 */
export function useResolvedTheme() {
  const { theme, resolvedTheme, systemTheme } = useTheme();
  const { settings } = useStore();

  // Return the actual theme being used (system resolves to light/dark)
  const resolved = resolvedTheme || (theme === "system" ? systemTheme : theme);

  return {
    theme: settings.theme, // User's preference
    resolvedTheme: resolved as "light" | "dark", // What's actually applied
    isSystemMode: settings.theme === "system",
  };
}
