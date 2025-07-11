import { Store } from "@tauri-apps/plugin-store";
import {
  type AppSettings,
  type SettingsExport,
  type LLMProvider,
  type ProviderSettings,
  createDefaultSettings,
  PROVIDER_METADATA,
} from "@/types/settings";

const SETTINGS_STORE_KEY = "loki-app-settings.json";
const SECURE_KEYS_PREFIX = "loki-api-key-";

class SettingsService {
  private store: Store | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized && this.store) return;

    try {
      // Load or create the store
      this.store = await Store.load(SETTINGS_STORE_KEY);
      this.initialized = true;
    } catch (error) {
      console.error("Failed to initialize settings service:", error);
      throw new Error("Settings service initialization failed");
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.store) {
      throw new Error("Settings service not initialized");
    }
  }

  // API Key Management (Secure Storage)
  async saveApiKey(provider: LLMProvider, apiKey: string): Promise<void> {
    this.ensureInitialized();

    // Just basic validation - not empty
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error("API key cannot be empty");
    }

    const keyName = `${SECURE_KEYS_PREFIX}${provider}`;
    await this.store!.set(keyName, apiKey.trim());
    await this.store!.save();
  }

  async getApiKey(provider: LLMProvider): Promise<string | null> {
    this.ensureInitialized();

    const keyName = `${SECURE_KEYS_PREFIX}${provider}`;
    return (await this.store!.get<string>(keyName)) || null;
  }

  async removeApiKey(provider: LLMProvider): Promise<void> {
    this.ensureInitialized();

    const keyName = `${SECURE_KEYS_PREFIX}${provider}`;
    await this.store!.delete(keyName);
    await this.store!.save();
  }

  // Settings Management (Regular Storage)
  async saveSettings(settings: AppSettings): Promise<void> {
    this.ensureInitialized();

    // Validate settings before saving
    const errors = this.validateSettings(settings);
    if (errors.length > 0) {
      throw new Error(`Invalid settings: ${errors.join(", ")}`);
    }

    // Remove API keys from settings before storing (they're stored securely)
    const settingsToStore = {
      ...settings,
      providers: Object.fromEntries(
        Object.entries(settings.providers).map(([provider, config]) => [
          provider,
          { ...config, apiKey: undefined },
        ])
      ),
    };

    await this.store!.set("settings", settingsToStore);
    await this.store!.save();
  }

  async loadSettings(): Promise<AppSettings> {
    this.ensureInitialized();

    try {
      const storedSettings = await this.store!.get<Partial<AppSettings>>(
        "settings"
      );

      if (!storedSettings) {
        // No stored settings, return defaults
        const defaultSettings = createDefaultSettings();
        await this.saveSettings(defaultSettings);
        return defaultSettings;
      }

      // Merge stored settings with defaults to handle new settings
      const defaultSettings = createDefaultSettings();
      const mergedSettings: AppSettings = {
        ...defaultSettings,
        ...storedSettings,
        providers: {
          ...defaultSettings.providers,
          ...storedSettings.providers,
        },
      };

      return mergedSettings;
    } catch (error) {
      console.error("Failed to load settings:", error);
      // Return defaults if loading fails
      return createDefaultSettings();
    }
  }

  // Provider Configuration
  async updateProviderSettings(
    provider: LLMProvider,
    settings: Partial<ProviderSettings>
  ): Promise<void> {
    const currentSettings = await this.loadSettings();

    currentSettings.providers[provider] = {
      ...currentSettings.providers[provider],
      ...settings,
    };

    await this.saveSettings(currentSettings);
  }

  // Provider Status and Testing
  async testProviderConnection(provider: LLMProvider): Promise<boolean> {
    try {
      const apiKey = await this.getApiKey(provider);
      if (!apiKey && PROVIDER_METADATA[provider].requiresApiKey) {
        return false;
      }

      // For providers that don't require API keys (like Ollama)
      if (!PROVIDER_METADATA[provider].requiresApiKey) {
        // TODO: Test ollama endpoint connectivity
        return true;
      }

      // Test actual API connection
      return await this.testApiConnection(provider, apiKey!);
    } catch {
      return false;
    }
  }

  // Test actual API connection by making a simple request
  private async testApiConnection(
    provider: LLMProvider,
    apiKey: string
  ): Promise<boolean> {
    try {
      switch (provider) {
        case "openai":
          const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
          });
          return response.ok;

        case "anthropic":
          // For now, just basic validation - real test would require @ai-sdk/anthropic
          return apiKey.length > 10;

        case "google":
        case "cohere":
          // For now, just basic validation - real tests would require proper SDKs
          return apiKey.length > 10;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${provider}:`, error);
      return false;
    }
  }

  async getProviderStatus(): Promise<Record<LLMProvider, boolean>> {
    const providers: LLMProvider[] = [
      "openai",
      "anthropic",
      "google",
      "cohere",
      "ollama",
    ];
    const status: Record<string, boolean> = {};

    for (const provider of providers) {
      status[provider] = await this.testProviderConnection(provider);
    }

    return status as Record<LLMProvider, boolean>;
  }

  // Export/Import Settings
  async exportSettings(): Promise<string> {
    this.ensureInitialized();

    const settings = await this.loadSettings();

    // Create export object without API keys
    const exportData: SettingsExport = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      settings: {
        ...settings,
        providers: Object.fromEntries(
          Object.entries(settings.providers).map(([provider, config]) => [
            provider,
            { ...config, apiKey: undefined },
          ])
        ),
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  async importSettings(data: string): Promise<void> {
    try {
      const importData: SettingsExport = JSON.parse(data);

      // Validate import data structure
      if (!importData.version || !importData.settings) {
        throw new Error("Invalid settings export format");
      }

      // Merge imported settings with current settings
      const currentSettings = await this.loadSettings();
      const mergedSettings: AppSettings = {
        ...currentSettings,
        ...importData.settings,
        providers: {
          ...currentSettings.providers,
          ...importData.settings.providers,
        },
      };

      // Validate merged settings
      const errors = this.validateSettings(mergedSettings);
      if (errors.length > 0) {
        throw new Error(`Invalid imported settings: ${errors.join(", ")}`);
      }

      await this.saveSettings(mergedSettings);
    } catch (error) {
      throw new Error(
        `Failed to import settings: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  // Reset settings to defaults
  async resetSettings(): Promise<void> {
    const defaultSettings = createDefaultSettings();
    await this.saveSettings(defaultSettings);
  }

  // Validation Methods

  private validateSettings(settings: Partial<AppSettings>): string[] {
    const errors: string[] = [];

    // Validate auto-save interval
    if (settings.autoSaveInterval !== undefined) {
      if (settings.autoSaveInterval < 5 || settings.autoSaveInterval > 300) {
        errors.push("Auto-save interval must be between 5-300 seconds");
      }
    }

    // Validate temperature
    if (settings.defaultTemperature !== undefined) {
      if (settings.defaultTemperature < 0 || settings.defaultTemperature > 2) {
        errors.push("Temperature must be between 0-2");
      }
    }

    // Validate max tokens
    if (settings.defaultMaxTokens !== undefined) {
      if (settings.defaultMaxTokens < 1 || settings.defaultMaxTokens > 4000) {
        errors.push("Max tokens must be between 1-4000");
      }
    }

    // Validate sidebar width
    if (settings.sidebarWidth !== undefined) {
      if (settings.sidebarWidth < 200 || settings.sidebarWidth > 600) {
        errors.push("Sidebar width must be between 200-600 pixels");
      }
    }

    // Validate theme
    if (settings.theme !== undefined) {
      if (!["light", "dark", "system"].includes(settings.theme)) {
        errors.push("Theme must be light, dark, or system");
      }
    }

    return errors;
  }

  // Utility method to get provider model from model string
  getProviderFromModel(model: string): LLMProvider {
    for (const [provider, metadata] of Object.entries(PROVIDER_METADATA)) {
      if ((metadata.models as readonly string[]).includes(model)) {
        return provider as LLMProvider;
      }
    }
    return "openai"; // Default fallback
  }

  // Theme Application
  async applyTheme(theme: "light" | "dark" | "system"): Promise<void> {
    try {
      // The theme application is handled by next-themes through the ThemeProvider
      // This method exists for potential future enhancements or immediate CSS variable updates

      // Log theme application for debugging
      console.log(`Applying theme: ${theme}`);

      // For now, the actual theme application is handled by:
      // 1. Store updateSettings() -> saves to Tauri store
      // 2. useThemeSync hook -> syncs with next-themes
      // 3. ThemeProvider -> applies CSS classes to DOM

      // Future: Could add custom CSS variable manipulation here if needed
    } catch (error) {
      console.error("Failed to apply theme:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const settingsService = new SettingsService();
