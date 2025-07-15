use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// Provider-specific settings
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderSettings {
    pub api_key: Option<String>,
    pub custom_endpoint: Option<String>,
    pub default_model: Option<String>,
    pub rate_limit_rpm: Option<u32>,
    pub enabled: bool,
}

// Supported LLM providers
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LLMProvider {
    OpenAI,
    Anthropic,
    Google,
    Ollama,
}

// Theme options
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

// Main settings interface
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    // LLM Provider settings
    pub providers: HashMap<String, ProviderSettings>,

    // UI/UX settings
    pub theme: ThemeMode,
    pub sidebar_width: u32,
    pub auto_save_interval: u32, // seconds

    // Default model parameters
    pub default_temperature: f32,
    pub default_max_tokens: u32,

    // Advanced settings
    pub enable_analytics: bool,
    pub debug_mode: bool,
    pub compact_mode: bool,
}

// Settings export/import interface (excluding API keys for security)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingsExport {
    pub version: String,
    pub timestamp: String,
    pub settings: AppSettingsExport,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettingsExport {
    pub providers: HashMap<String, ProviderSettingsExport>,
    pub theme: ThemeMode,
    pub sidebar_width: u32,
    pub auto_save_interval: u32,
    pub default_temperature: f32,
    pub default_max_tokens: u32,
    pub enable_analytics: bool,
    pub debug_mode: bool,
    pub compact_mode: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderSettingsExport {
    pub custom_endpoint: Option<String>,
    pub default_model: Option<String>,
    pub rate_limit_rpm: Option<u32>,
    pub enabled: bool,
}

// Default settings factory
impl Default for AppSettings {
    fn default() -> Self {
        let mut providers = HashMap::new();

        providers.insert(
            "openai".to_string(),
            ProviderSettings {
                api_key: None,
                custom_endpoint: None,
                default_model: Some("gpt-4o".to_string()),
                rate_limit_rpm: Some(60),
                enabled: true,
            },
        );

        providers.insert(
            "anthropic".to_string(),
            ProviderSettings {
                api_key: None,
                custom_endpoint: None,
                default_model: Some("claude-sonnet-4-20250514".to_string()),
                rate_limit_rpm: Some(60),
                enabled: false,
            },
        );

        providers.insert(
            "google".to_string(),
            ProviderSettings {
                api_key: None,
                custom_endpoint: None,
                default_model: Some("gemini-2.5-pro".to_string()),
                rate_limit_rpm: Some(60),
                enabled: false,
            },
        );

        providers.insert(
            "ollama".to_string(),
            ProviderSettings {
                api_key: None,
                custom_endpoint: Some("http://localhost:11434".to_string()),
                default_model: Some("llama2".to_string()),
                rate_limit_rpm: Some(0), // No rate limit for local models
                enabled: false,
            },
        );

        AppSettings {
            providers,
            theme: ThemeMode::System,
            sidebar_width: 320,
            auto_save_interval: 30, // 30 seconds
            default_temperature: 0.7,
            default_max_tokens: 150,
            enable_analytics: false,
            debug_mode: false,
            compact_mode: false,
        }
    }
}

// Provider metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderMetadata {
    pub name: String,
    pub description: String,
    pub models: Vec<String>,
}

pub fn get_provider_metadata() -> HashMap<String, ProviderMetadata> {
    let mut metadata = HashMap::new();

    metadata.insert(
        "openai".to_string(),
        ProviderMetadata {
            name: "OpenAI".to_string(),
            description: "GPT models from OpenAI".to_string(),
            models: vec![
                "gpt-4.1".to_string(),
                "gpt-4o".to_string(),
                "o3".to_string(),
                "o3-mini".to_string(),
            ],
        },
    );

    metadata.insert(
        "anthropic".to_string(),
        ProviderMetadata {
            name: "Anthropic".to_string(),
            description: "Claude models from Anthropic".to_string(),
            models: vec![
                "claude-sonnet-4-20250514".to_string(),
                "claude-3-opus-20240229".to_string(),
                "claude-3-sonnet-20240229".to_string(),
            ],
        },
    );

    metadata.insert(
        "google".to_string(),
        ProviderMetadata {
            name: "Google".to_string(),
            description: "Gemini models from Google".to_string(),
            models: vec![
                "gemini-2.5-pro".to_string(),
                "gemini-1.5-pro".to_string(),
                "gemini-1.5-flash".to_string(),
            ],
        },
    );

    metadata.insert(
        "ollama".to_string(),
        ProviderMetadata {
            name: "Ollama".to_string(),
            description: "Local models via Ollama".to_string(),
            models: vec![
                "llama2".to_string(),
                "mistral".to_string(),
                "codellama".to_string(),
                "llama3".to_string(),
            ],
        },
    );

    metadata
}

// Helper functions for conversions
impl AppSettings {
    pub fn to_export(&self) -> AppSettingsExport {
        let mut export_providers = HashMap::new();
        for (key, provider) in &self.providers {
            export_providers.insert(
                key.clone(),
                ProviderSettingsExport {
                    custom_endpoint: provider.custom_endpoint.clone(),
                    default_model: provider.default_model.clone(),
                    rate_limit_rpm: provider.rate_limit_rpm,
                    enabled: provider.enabled,
                },
            );
        }

        AppSettingsExport {
            providers: export_providers,
            theme: self.theme.clone(),
            sidebar_width: self.sidebar_width,
            auto_save_interval: self.auto_save_interval,
            default_temperature: self.default_temperature,
            default_max_tokens: self.default_max_tokens,
            enable_analytics: self.enable_analytics,
            debug_mode: self.debug_mode,
            compact_mode: self.compact_mode,
        }
    }
}
