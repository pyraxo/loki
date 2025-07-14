// Provider-specific settings
export interface ProviderSettings {
  apiKey?: string;
  customEndpoint?: string;
  defaultModel?: string;
  rateLimitRpm?: number;
  enabled: boolean;
}

// Supported LLM providers
export type LLMProvider =
  | "openai"
  | "anthropic"
  | "google"
  | "ollama";

// Theme options
export type ThemeMode = "light" | "dark" | "system";

// Main settings interface
export interface AppSettings {
  // LLM Provider settings
  providers: {
    openai: ProviderSettings;
    anthropic: ProviderSettings;
    google: ProviderSettings;
    ollama: ProviderSettings;
  };

  // UI/UX settings
  theme: ThemeMode;
  sidebarWidth: number;
  autoSaveInterval: number; // seconds

  // Default model parameters
  defaultTemperature: number;
  defaultMaxTokens: number;

  // Advanced settings
  enableAnalytics: boolean;
  debugMode: boolean;
  compactMode: boolean;
}

// Settings export/import interface (excluding API keys for security)
export interface SettingsExport {
  version: string;
  timestamp: string;
  settings: Omit<AppSettings, "providers"> & {
    providers: Record<string, Omit<ProviderSettings, "apiKey">>;
  };
}

// Default settings factory
export const createDefaultSettings = (): AppSettings => ({
  providers: {
    openai: {
      enabled: true,
      defaultModel: "gpt-4o",
      rateLimitRpm: 60,
    },
    anthropic: {
      enabled: false,
      defaultModel: "claude-sonnet-4-20250514",
      rateLimitRpm: 60,
    },
    google: {
      enabled: false,
      defaultModel: "gemini-2.5-pro",
      rateLimitRpm: 60,
    },
    ollama: {
      enabled: false,
      customEndpoint: "http://localhost:11434",
      defaultModel: "llama2",
      rateLimitRpm: 0, // No rate limit for local models
    },
  },

  // UI defaults
  theme: "system",
  sidebarWidth: 320,
  autoSaveInterval: 30, // 30 seconds

  // Model parameter defaults
  defaultTemperature: 0.7,
  defaultMaxTokens: 150,

  // Advanced defaults
  enableAnalytics: false,
  debugMode: false,
  compactMode: false,
});

// Provider display names and metadata
export const PROVIDER_METADATA = {
  openai: {
    name: "OpenAI",
    description: "GPT models from OpenAI",
    models: ["gpt-4.1", "gpt-4o", "o3", "o3-mini"],
    requiresApiKey: true,
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude models from Anthropic",
    models: ["claude-sonnet-4-20250514", "claude-3-7-sonnet-latest"],
    requiresApiKey: true,
  },
  google: {
    name: "Google",
    description: "Gemini models from Google",
    models: ["gemini-2.5-pro", "gemini-2.5-flash"],
    requiresApiKey: true,
  },
  ollama: {
    name: "Ollama",
    description: "Local models via Ollama",
    models: ["llama2", "mistral", "codellama"],
    requiresApiKey: false,
  },
} as const;
