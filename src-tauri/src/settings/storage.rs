use crate::settings::types::*;
use serde_json::Value;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::AppHandle;
use tauri_plugin_store::{Store, StoreExt};

// Settings storage manager
pub struct SettingsStorage {
    store: Mutex<Option<Arc<Store<tauri::Wry>>>>,
}

impl SettingsStorage {
    pub fn new() -> Self {
        Self {
            store: Mutex::new(None),
        }
    }

    // Initialize the store with app handle
    pub fn init(&self, app: &AppHandle) -> Result<(), String> {
        let store = app.store_builder("settings.json").build();
        match store {
            Ok(s) => {
                *self.store.lock().unwrap() = Some(s);
                Ok(())
            }
            Err(e) => Err(format!("Failed to initialize settings store: {}", e)),
        }
    }

    // Get current settings or default if not found
    pub fn get_settings(&self) -> Result<AppSettings, String> {
        let store_lock = self.store.lock().unwrap();
        let store = store_lock.as_ref().ok_or("Store not initialized")?;

        // Try to get settings from store
        match store.get("settings") {
            Some(value) => {
                // Try to deserialize from store
                serde_json::from_value(value.clone())
                    .map_err(|e| format!("Failed to deserialize settings: {}", e))
            }
            None => {
                // Return default settings if none found
                Ok(AppSettings::default())
            }
        }
    }

    // Save settings to store
    pub fn save_settings(&self, settings: &AppSettings) -> Result<(), String> {
        let store_lock = self.store.lock().unwrap();
        let store = store_lock.as_ref().ok_or("Store not initialized")?;

        let value = serde_json::to_value(settings)
            .map_err(|e| format!("Failed to serialize settings: {}", e))?;

        store.set("settings", value);
        store
            .save()
            .map_err(|e| format!("Failed to save settings: {}", e))
    }

    // Update specific settings fields
    pub fn update_settings(&self, updates: HashMap<String, Value>) -> Result<AppSettings, String> {
        let mut settings = self.get_settings()?;

        // Apply updates to settings
        for (key, value) in updates {
            match key.as_str() {
                "theme" => {
                    if let Ok(theme) = serde_json::from_value::<ThemeMode>(value) {
                        settings.theme = theme;
                    }
                }
                "sidebar_width" => {
                    if let Ok(width) = serde_json::from_value::<u32>(value) {
                        settings.sidebar_width = width;
                    }
                }
                "auto_save_interval" => {
                    if let Ok(interval) = serde_json::from_value::<u32>(value) {
                        settings.auto_save_interval = interval;
                    }
                }
                "default_temperature" => {
                    if let Ok(temp) = serde_json::from_value::<f32>(value) {
                        settings.default_temperature = temp;
                    }
                }
                "default_max_tokens" => {
                    if let Ok(tokens) = serde_json::from_value::<u32>(value) {
                        settings.default_max_tokens = tokens;
                    }
                }
                "enable_analytics" => {
                    if let Ok(enable) = serde_json::from_value::<bool>(value) {
                        settings.enable_analytics = enable;
                    }
                }
                "debug_mode" => {
                    if let Ok(debug) = serde_json::from_value::<bool>(value) {
                        settings.debug_mode = debug;
                    }
                }
                "compact_mode" => {
                    if let Ok(compact) = serde_json::from_value::<bool>(value) {
                        settings.compact_mode = compact;
                    }
                }
                _ => {} // Ignore unknown fields
            }
        }

        self.save_settings(&settings)?;
        Ok(settings)
    }

    // Update provider settings
    pub fn update_provider_settings(
        &self,
        provider: &str,
        updates: HashMap<String, Value>,
    ) -> Result<AppSettings, String> {
        let mut settings = self.get_settings()?;

        if let Some(provider_settings) = settings.providers.get_mut(provider) {
            for (key, value) in updates {
                match key.as_str() {
                    "enabled" => {
                        if let Ok(enabled) = serde_json::from_value::<bool>(value) {
                            provider_settings.enabled = enabled;
                        }
                    }
                    "api_key" => {
                        if let Ok(key) = serde_json::from_value::<String>(value) {
                            provider_settings.api_key =
                                if key.is_empty() { None } else { Some(key) };
                        }
                    }
                    "custom_endpoint" => {
                        if let Ok(endpoint) = serde_json::from_value::<String>(value) {
                            provider_settings.custom_endpoint = if endpoint.is_empty() {
                                None
                            } else {
                                Some(endpoint)
                            };
                        }
                    }
                    "default_model" => {
                        if let Ok(model) = serde_json::from_value::<String>(value) {
                            provider_settings.default_model =
                                if model.is_empty() { None } else { Some(model) };
                        }
                    }
                    "rate_limit_rpm" => {
                        if let Ok(limit) = serde_json::from_value::<u32>(value) {
                            provider_settings.rate_limit_rpm = Some(limit);
                        }
                    }
                    _ => {} // Ignore unknown fields
                }
            }
        }

        self.save_settings(&settings)?;
        Ok(settings)
    }

    // Reset settings to default
    pub fn reset_settings(&self) -> Result<AppSettings, String> {
        let settings = AppSettings::default();
        self.save_settings(&settings)?;
        Ok(settings)
    }

    // Export settings (excluding API keys)
    pub fn export_settings(&self) -> Result<SettingsExport, String> {
        let settings = self.get_settings()?;
        let export = SettingsExport {
            version: "1.0.0".to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            settings: settings.to_export(),
        };
        Ok(export)
    }

    // Import settings from export data
    pub fn import_settings(&self, export_data: &str) -> Result<AppSettings, String> {
        let export: SettingsExport = serde_json::from_str(export_data)
            .map_err(|e| format!("Failed to parse settings export: {}", e))?;

        let mut settings = self.get_settings()?;

        // Import non-sensitive settings
        settings.theme = export.settings.theme;
        settings.sidebar_width = export.settings.sidebar_width;
        settings.auto_save_interval = export.settings.auto_save_interval;
        settings.default_temperature = export.settings.default_temperature;
        settings.default_max_tokens = export.settings.default_max_tokens;
        settings.enable_analytics = export.settings.enable_analytics;
        settings.debug_mode = export.settings.debug_mode;
        settings.compact_mode = export.settings.compact_mode;

        // Import provider settings (excluding API keys)
        for (provider_name, export_provider) in export.settings.providers {
            if let Some(provider) = settings.providers.get_mut(&provider_name) {
                provider.custom_endpoint = export_provider.custom_endpoint;
                provider.default_model = export_provider.default_model;
                provider.rate_limit_rpm = export_provider.rate_limit_rpm;
                provider.enabled = export_provider.enabled;
                // Keep existing API key
            }
        }

        self.save_settings(&settings)?;
        Ok(settings)
    }

    // Get API key for a specific provider
    pub fn get_api_key(&self, provider: &str) -> Result<Option<String>, String> {
        let settings = self.get_settings()?;
        Ok(settings
            .providers
            .get(provider)
            .and_then(|p| p.api_key.clone()))
    }

    // Set API key for a specific provider
    pub fn set_api_key(
        &self,
        provider: &str,
        api_key: Option<String>,
    ) -> Result<AppSettings, String> {
        let mut settings = self.get_settings()?;

        if let Some(provider_settings) = settings.providers.get_mut(provider) {
            provider_settings.api_key = api_key;
        }

        self.save_settings(&settings)?;
        Ok(settings)
    }
}

// Global settings storage instance
lazy_static::lazy_static! {
    pub static ref SETTINGS_STORAGE: SettingsStorage = SettingsStorage::new();
}
