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
  | "cohere"
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
    cohere: ProviderSettings;
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
      defaultModel: "gpt-3.5-turbo",
      rateLimitRpm: 60,
    },
    anthropic: {
      enabled: false,
      defaultModel: "claude-3-haiku",
      rateLimitRpm: 60,
    },
    google: {
      enabled: false,
      defaultModel: "gemini-pro",
      rateLimitRpm: 60,
    },
    cohere: {
      enabled: false,
      defaultModel: "command",
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
    models: ["gpt-4", "gpt-3.5-turbo"],
    requiresApiKey: true,
  },
  anthropic: {
    name: "Anthropic",
    description: "Claude models from Anthropic",
    models: ["claude-3-haiku", "claude-3-sonnet"],
    requiresApiKey: true,
  },
  google: {
    name: "Google",
    description: "Gemini models from Google",
    models: ["gemini-pro", "gemini-pro-vision"],
    requiresApiKey: true,
  },
  cohere: {
    name: "Cohere",
    description: "Command models from Cohere",
    models: ["command", "command-light"],
    requiresApiKey: true,
  },
  ollama: {
    name: "Ollama",
    description: "Local models via Ollama",
    models: ["llama2", "mistral", "codellama"],
    requiresApiKey: false,
  },
} as const;
