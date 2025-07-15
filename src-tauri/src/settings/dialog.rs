use tauri::{AppHandle, Manager};

// Open settings dialog window
pub async fn open_settings_dialog(app: AppHandle) -> Result<(), String> {
    // Check if settings dialog is already open
    if let Some(_window) = app.get_webview_window("settings-dialog") {
        // Focus the existing window
        _window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }

    // Create new settings dialog window
    let window = tauri::WebviewWindowBuilder::new(
        &app,
        "settings-dialog",
        tauri::WebviewUrl::App("settings.html".into()),
    )
    .title("Settings")
    .inner_size(800.0, 600.0)
    .min_inner_size(600.0, 400.0)
    .center()
    .resizable(true)
    .closable(true)
    .minimizable(false)
    .maximizable(false)
    .always_on_top(true)
    .build()
    .map_err(|e| format!("Failed to create settings dialog: {}", e))?;

    // Focus the new window
    window.set_focus().map_err(|e| e.to_string())?;

    Ok(())
}

// Close settings dialog window
pub async fn close_settings_dialog(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("settings-dialog") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

// Check if settings dialog is open
pub async fn is_settings_dialog_open(app: AppHandle) -> Result<bool, String> {
    Ok(app.get_webview_window("settings-dialog").is_some())
}
