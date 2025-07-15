use crate::settings::storage::SETTINGS_STORAGE;
use crate::settings::types::*;
use serde_json::Value;
use std::collections::HashMap;
use tauri::{command, AppHandle, Emitter};
use tauri_plugin_notification::{NotificationExt, PermissionState};

// Initialize settings storage
#[command]
pub async fn init_settings(app: AppHandle) -> Result<(), String> {
    SETTINGS_STORAGE.init(&app)?;
    Ok(())
}

// Get current settings
#[command]
pub async fn get_settings() -> Result<AppSettings, String> {
    SETTINGS_STORAGE.get_settings()
}

// Update general settings
#[command]
pub async fn update_settings(
    app: AppHandle,
    updates: HashMap<String, Value>,
) -> Result<AppSettings, String> {
    let result = SETTINGS_STORAGE.update_settings(updates);

    match &result {
        Ok(settings) => {
            // Emit settings update event
            app.emit("settings-updated", settings).ok();
        }
        Err(error) => {
            // Send error notification
            send_error_notification(&app, &format!("Failed to update settings: {}", error)).await;
        }
    }

    result
}

// Update provider settings
#[command]
pub async fn update_provider_settings(
    app: AppHandle,
    provider: String,
    updates: HashMap<String, Value>,
) -> Result<AppSettings, String> {
    let result = SETTINGS_STORAGE.update_provider_settings(&provider, updates);

    match &result {
        Ok(settings) => {
            // Emit settings update event
            app.emit("settings-updated", settings).ok();
        }
        Err(error) => {
            // Send error notification
            send_error_notification(
                &app,
                &format!("Failed to update provider settings: {}", error),
            )
            .await;
        }
    }

    result
}

// Reset settings to default
#[command]
pub async fn reset_settings(app: AppHandle) -> Result<AppSettings, String> {
    let result = SETTINGS_STORAGE.reset_settings();

    match &result {
        Ok(settings) => {
            // Emit settings update event
            app.emit("settings-updated", settings).ok();
            // Send success notification
            send_success_notification(&app, "Settings have been reset to default").await;
        }
        Err(error) => {
            // Send error notification
            send_error_notification(&app, &format!("Failed to reset settings: {}", error)).await;
        }
    }

    result
}

// Export settings
#[command]
pub async fn export_settings(app: AppHandle) -> Result<String, String> {
    let result = SETTINGS_STORAGE.export_settings();

    match &result {
        Ok(export) => match serde_json::to_string_pretty(export) {
            Ok(json) => {
                send_success_notification(&app, "Settings exported successfully").await;
                Ok(json)
            }
            Err(e) => {
                let error = format!("Failed to serialize settings export: {}", e);
                send_error_notification(&app, &error).await;
                Err(error)
            }
        },
        Err(error) => {
            send_error_notification(&app, &format!("Failed to export settings: {}", error)).await;
            Err(error.clone())
        }
    }
}

// Import settings
#[command]
pub async fn import_settings(app: AppHandle, export_data: String) -> Result<AppSettings, String> {
    let result = SETTINGS_STORAGE.import_settings(&export_data);

    match &result {
        Ok(settings) => {
            // Emit settings update event
            app.emit("settings-updated", settings).ok();
            send_success_notification(&app, "Settings imported successfully").await;
        }
        Err(error) => {
            send_error_notification(&app, &format!("Failed to import settings: {}", error)).await;
        }
    }

    result
}

// Get API key for a provider
#[command]
pub async fn get_api_key(provider: String) -> Result<Option<String>, String> {
    SETTINGS_STORAGE.get_api_key(&provider)
}

// Set API key for a provider
#[command]
pub async fn set_api_key(
    app: AppHandle,
    provider: String,
    api_key: Option<String>,
) -> Result<AppSettings, String> {
    let result = SETTINGS_STORAGE.set_api_key(&provider, api_key);

    match &result {
        Ok(settings) => {
            // Emit settings update event
            app.emit("settings-updated", settings).ok();
            send_success_notification(&app, &format!("API key updated for {}", provider)).await;
        }
        Err(error) => {
            send_error_notification(&app, &format!("Failed to update API key: {}", error)).await;
        }
    }

    result
}

// Test provider connection
#[command]
pub async fn test_provider_connection(
    app: AppHandle,
    provider: String,
    config: ProviderSettings,
) -> Result<bool, String> {
    // Emit test started event
    app.emit("provider-test-started", &provider).ok();

    let result = test_provider_internal(&provider, &config).await;

    match &result {
        Ok(success) => {
            if *success {
                app.emit("provider-test-completed", (&provider, true)).ok();
                send_success_notification(
                    &app,
                    &format!("{} connection test successful", provider),
                )
                .await;
            } else {
                app.emit("provider-test-completed", (&provider, false)).ok();
                send_error_notification(&app, &format!("{} connection test failed", provider))
                    .await;
            }
        }
        Err(error) => {
            app.emit("provider-test-failed", (&provider, error)).ok();
            send_error_notification(
                &app,
                &format!("{} connection test error: {}", provider, error),
            )
            .await;
        }
    }

    result
}

// Get provider metadata
#[command]
pub fn get_provider_metadata_command() -> Result<HashMap<String, ProviderMetadata>, String> {
    Ok(get_provider_metadata())
}

// Open settings dialog
#[command]
pub async fn open_settings_dialog(app: AppHandle) -> Result<(), String> {
    // This will be implemented in the dialog module
    crate::settings::dialog::open_settings_dialog(app).await
}

// Close settings dialog
#[command]
pub async fn close_settings_dialog(app: AppHandle) -> Result<(), String> {
    // This will be implemented in the dialog module
    crate::settings::dialog::close_settings_dialog(app).await
}

// Helper function to test provider connection
async fn test_provider_internal(provider: &str, config: &ProviderSettings) -> Result<bool, String> {
    // Mock implementation - in real app, this would make actual API calls
    match provider {
        "openai" => {
            if let Some(api_key) = &config.api_key {
                if !api_key.is_empty() {
                    // Simulate API call delay
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    Ok(api_key.starts_with("sk-")) // Basic validation
                } else {
                    Err("API key is required for OpenAI".to_string())
                }
            } else {
                Err("API key is required for OpenAI".to_string())
            }
        }
        "anthropic" => {
            if let Some(api_key) = &config.api_key {
                if !api_key.is_empty() {
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    Ok(api_key.starts_with("sk-ant-")) // Basic validation
                } else {
                    Err("API key is required for Anthropic".to_string())
                }
            } else {
                Err("API key is required for Anthropic".to_string())
            }
        }
        "google" => {
            if let Some(api_key) = &config.api_key {
                if !api_key.is_empty() {
                    tokio::time::sleep(std::time::Duration::from_millis(1000)).await;
                    Ok(api_key.len() > 10) // Basic validation
                } else {
                    Err("API key is required for Google".to_string())
                }
            } else {
                Err("API key is required for Google".to_string())
            }
        }
        "ollama" => {
            if let Some(endpoint) = &config.custom_endpoint {
                tokio::time::sleep(std::time::Duration::from_millis(500)).await;
                // Simple check for localhost endpoint
                Ok(endpoint.contains("localhost") || endpoint.contains("127.0.0.1"))
            } else {
                Err("Custom endpoint is required for Ollama".to_string())
            }
        }
        _ => Err(format!("Unknown provider: {}", provider)),
    }
}

// Helper function to send success notifications
async fn send_success_notification(app: &AppHandle, message: &str) {
    if let Ok(permission) = app.notification().permission_state() {
        if permission == PermissionState::Granted {
            app.notification()
                .builder()
                .title("Settings")
                .body(message)
                .show()
                .ok();
        }
    }
}

// Helper function to send error notifications
async fn send_error_notification(app: &AppHandle, message: &str) {
    if let Ok(permission) = app.notification().permission_state() {
        if permission == PermissionState::Granted {
            app.notification()
                .builder()
                .title("Settings Error")
                .body(message)
                .show()
                .ok();
        }
    }
}

// All commands are exported individually and registered in lib.rs
