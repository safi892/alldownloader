use crate::download::DownloadManager;
use tauri::{AppHandle, State};

#[tauri::command]
pub async fn start_download(
    app: AppHandle,
    state: State<'_, DownloadManager>,
    url: String,
    title: String,
    path: Option<String>,
    format_spec: Option<String>,
    cookies: Option<String>,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();
    state.start_download(app, url, id.clone(), title, path, format_spec, cookies);
    Ok(id)
}

#[tauri::command]
pub async fn get_video_metadata(
    app: AppHandle,
    state: State<'_, DownloadManager>,
    url: String,
) -> Result<crate::download::VideoMetadata, String> {
    state.get_video_metadata(app, url).await
}

#[tauri::command]
pub async fn cancel_download(
    state: State<'_, DownloadManager>,
    id: String,
) -> Result<(), String> {
    if state.cancel_download(&id) {
        Ok(())
    } else {
        Err("Task not found or already terminated".to_string())
    }
}

#[tauri::command]
pub async fn list_downloads(
    state: State<'_, DownloadManager>,
) -> Result<Vec<crate::download::DownloadProgressPayload>, String> {
    Ok(state.get_tasks())
}

#[tauri::command]
pub async fn show_in_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_available_space(path: String) -> Result<u64, String> {
    let p = if path.is_empty() {
        #[cfg(target_os = "macos")]
        { "/Users" }
        #[cfg(target_os = "windows")]
        { "C:\\" }
        #[cfg(target_os = "linux")]
        { "/" }
    } else {
        &path
    };

    let space = fs2::available_space(p).map_err(|e| e.to_string())?;
    Ok(space)
}
