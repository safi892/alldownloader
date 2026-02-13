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
pub async fn pause_download(
    state: State<'_, DownloadManager>,
    id: String,
) -> Result<(), String> {
    if state.pause_download(&id) {
        Ok(())
    } else {
        Err("Could not pause task".to_string())
    }
}

#[tauri::command]
pub async fn resume_download(
    state: State<'_, DownloadManager>,
    id: String,
) -> Result<(), String> {
    if state.resume_download(&id) {
        Ok(())
    } else {
        Err("Could not resume task".to_string())
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
    let path_buf = std::path::PathBuf::from(&path);
    let is_file = path_buf.is_file();

    #[cfg(target_os = "macos")]
    {
        let mut cmd = std::process::Command::new("open");
        if is_file {
            cmd.arg("-R");
        }
        cmd.arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        if is_file {
            std::process::Command::new("explorer")
                .arg("/select,")
                .arg(&path)
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            std::process::Command::new("explorer")
                .arg(&path)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    #[cfg(target_os = "linux")]
    {
        // Linux is tricky, many file managers exist. 
        // xdg-open doesn't reveal. For now we just open the parent if it's a file.
        let target = if is_file {
            path_buf.parent().unwrap_or(&path_buf).to_string_lossy().to_string()
        } else {
            path
        };

        std::process::Command::new("xdg-open")
            .arg(&target)
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
