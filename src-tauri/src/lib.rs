// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod settings;

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            settings::init_settings,
            settings::get_settings,
            settings::update_settings,
            settings::update_provider_settings,
            settings::reset_settings,
            settings::export_settings,
            settings::import_settings,
            settings::get_api_key,
            settings::set_api_key,
            settings::test_provider_connection,
            settings::get_provider_metadata_command,
            settings::open_settings_dialog,
            settings::close_settings_dialog,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
