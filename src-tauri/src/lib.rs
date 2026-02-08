

use tauri::Manager;
mod commands;
mod download;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .manage(download::DownloadManager::new())
        .setup(|app| {
            let tray_menu = tauri::menu::Menu::with_items(app, &[
                &tauri::menu::MenuItem::with_id(app, "show", "Show VidFlow", true, None::<&str>)?,
                &tauri::menu::PredefinedMenuItem::separator(app)?,
                &tauri::menu::MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
            ])?;

            let _tray = tauri::tray::TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "show" => {
                            let window = app.get_webview_window("main").unwrap();
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                        "quit" => {
                            app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_download,
            commands::cancel_download,
            commands::get_video_metadata,
            commands::show_in_folder,
            commands::get_available_space
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
