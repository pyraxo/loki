import { settingsService } from "@/lib/settings-service";
import { type AppSettings, type LLMProvider, type ProviderSettings, type ThemeMode, createDefaultSettings } from "@/types/settings";
import { type StateCreator } from "zustand";
import { type SettingsSlice, type StoreState } from "../types";

export const createSettingsSlice: StateCreator<
  StoreState,
  [],
  [],
  SettingsSlice
> = (set, get) => ({
  // Initial state
  settings: createDefaultSettings(),
  settingsLoaded: false,

  // Settings actions
  updateSettings: async (settingsUpdate: Partial<AppSettings>) => {
    try {
      const { settings } = get();
      const newSettings = { ...settings, ...settingsUpdate };

      await settingsService.saveSettings(newSettings);
      set({ settings: newSettings });
    } catch (error) {
      console.error("Failed to update settings:", error);
      throw error;
    }
  },

  updateProviderSettings: async (
    provider: LLMProvider,
    providerSettings: Partial<ProviderSettings>
  ) => {
    try {
      await settingsService.updateProviderSettings(provider, providerSettings);

      const { settings } = get();
      const newSettings = {
        ...settings,
        providers: {
          ...settings.providers,
          [provider]: {
            ...settings.providers[provider],
            ...providerSettings,
          },
        },
      };

      set({ settings: newSettings });
    } catch (error) {
      console.error("Failed to update provider settings:", error);
      throw error;
    }
  },

  setApiKey: async (provider: LLMProvider, apiKey: string) => {
    try {
      await settingsService.saveApiKey(provider, apiKey);
      // Note: API keys are not stored in the settings state for security
    } catch (error) {
      console.error("Failed to save API key:", error);
      throw error;
    }
  },

  getApiKey: async (provider: LLMProvider) => {
    try {
      return await settingsService.getApiKey(provider);
    } catch (error) {
      console.error("Failed to get API key:", error);
      return null;
    }
  },

  // Theme actions
  setTheme: async (theme: ThemeMode) => {
    try {
      // Update settings which will persist the theme
      await get().updateSettings({ theme });

      // The actual DOM theme application will be handled by the useThemeSync hook
      if (process.env.NODE_ENV === "development") {
        console.log(`Theme set to: ${theme}`);
      }
    } catch (error) {
      console.error("Failed to set theme:", error);
      throw error;
    }
  },

  initializeTheme: async () => {
    try {
      // Import theme service
      const { themeService } = await import("@/lib/theme-service");

      // Initialize the theme service
      await themeService.initializeTheme();

      if (process.env.NODE_ENV === "development") {
        console.log("Theme initialized");
      }
    } catch (error) {
      console.error("Failed to initialize theme:", error);
    }
  },

  // Settings export/import
  exportSettings: async () => {
    try {
      return await settingsService.exportSettings();
    } catch (error) {
      console.error("Failed to export settings:", error);
      throw error;
    }
  },

  importSettings: async (data: string) => {
    try {
      await settingsService.importSettings(data);
      const settings = await settingsService.loadSettings();
      set({ settings });
    } catch (error) {
      console.error("Failed to import settings:", error);
      throw error;
    }
  },

  resetSettings: async () => {
    try {
      await settingsService.resetSettings();
      const settings = await settingsService.loadSettings();
      set({ settings });
    } catch (error) {
      console.error("Failed to reset settings:", error);
      throw error;
    }
  },
}); 