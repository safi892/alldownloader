use tauri::{Manager, Emitter};
use tauri_plugin_shell::ShellExt;
use std::sync::{Arc, Mutex};
use std::fs;
mod commands;
mod download;
mod persistence;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_log::Builder::new()
            .targets([
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir { file_name: Some("vidflow".to_string()) }),
                tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
            ])
            .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepOne)
            .level(log::LevelFilter::Info)
            .build())
        .manage(download::DownloadManager::new())
        .setup(|app| {
            // Persistence Initialization
            let app_data_dir = app.path().app_data_dir().unwrap_or_else(|_| std::env::temp_dir());
            if !app_data_dir.exists() {
                let _ = fs::create_dir_all(&app_data_dir);
            }
            let persistence = persistence::PersistenceManager::new(app_data_dir);
            
            // Crash Recovery: Load tasks and handle non-terminal states
            if let Ok(persisted_tasks) = persistence.load_tasks() {
                let manager = app.state::<download::DownloadManager>();
                let mut tasks = manager.tasks.lock().unwrap();
                for pt in persisted_tasks {
                    let status = if matches!(pt.status, download::DownloadStatus::Completed | download::DownloadStatus::Cancelled | download::DownloadStatus::Error) {
                        pt.status
                    } else {
                        download::DownloadStatus::Error // Crashed during work
                    };
                    
                    let mut task = download::DownloadTask::new(pt.id.clone(), pt.url.clone(), pt.title.clone());
                    task.status = status;
                    task.progress = pt.progress;
                    task.final_path = pt.download_dir.map(std::path::PathBuf::from);
                    
                    tasks.insert(pt.id, Arc::new(Mutex::new(task)));
                }
            }
            
            app.manage(persistence);

            // Binary Detection & Capability Checks
            let app_handle = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                let shell = app_handle.shell();
                // Check yt-dlp
                match shell.command("yt-dlp").args(["--version"]).output().await {
                    Ok(output) if output.status.success() => {
                        let version = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        // Minimal version check (e.g. 2023.01.01)
                        if version < "2023.01.01".to_string() {
                             let _ = app_handle.emit("binary-error", format!("yt-dlp version {} is too old. Please update to at least 2023.01.01.", version));
                        }
                    },
                    _ => {
                        let _ = app_handle.emit("binary-error", "yt-dlp not found in PATH. Core download functionality will be unavailable.");
                    }
                }

                // Check ffmpeg
                match shell.command("ffmpeg").args(["-version"]).output().await {
                    Ok(output) if output.status.success() => {
                        // Check for specific codecs/features if necessary
                    },
                    _ => {
                        let _ = app_handle.emit("binary-error", "ffmpeg not found in PATH. Merging and post-processing will be unavailable.");
                    }
                }
            });

            let tray_menu = tauri::menu::Menu::with_items(app, &[
                &tauri::menu::MenuItem::with_id(app, "show", "Show VidFlow", true, None::<&str>)?,
                &tauri::menu::PredefinedMenuItem::separator(app)?,
                &tauri::menu::MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?,
            ])?;

            let _tray = tauri::tray::TrayIconBuilder::with_id("main-tray")
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&tray_menu)
                .on_menu_event(|app: &tauri::AppHandle, event| {
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
            commands::list_downloads,
            commands::show_in_folder,
            commands::get_available_space
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| match event {
        tauri::RunEvent::Exit => {
            let manager = app_handle.state::<download::DownloadManager>();
            manager.cleanup_all();
        }
        _ => {}
    });
}
