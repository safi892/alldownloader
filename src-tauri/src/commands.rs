use crate::download::DownloadManager;
use tauri::{AppHandle, Manager, State};
use url::Url;

fn validate_url(url: &str) -> Result<(), String> {
    if url.len() > 2048 {
        return Err("URL too long".to_string());
    }
    let parsed = Url::parse(url).map_err(|_| "Invalid URL".to_string())?;
    match parsed.scheme() {
        "http" | "https" => Ok(()),
        _ => Err("Only http/https URLs are allowed".to_string()),
    }
}

fn validate_format_spec(spec: &str) -> Result<(), String> {
    if spec.is_empty() || spec.len() > 64 {
        return Err("Invalid format spec".to_string());
    }

    if spec == "audio" || spec == "best" || spec == "bestvideo" {
        return Ok(());
    }

    if let Some(value) = spec.strip_prefix("bestvideo[height<=") {
        if let Some(num) = value.strip_suffix(']') {
            let allowed = ["360", "480", "720", "1080", "1440", "2160", "4320"];
            if allowed.contains(&num) {
                return Ok(());
            }
        }
        return Err("Invalid height filter".to_string());
    }

    if spec.chars().all(|c| c.is_ascii_digit()) {
        return Ok(());
    }

    Err("Invalid format spec".to_string())
}

fn validate_download_path(path: &str, app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let path_buf = std::path::PathBuf::from(path);
    if !path_buf.is_absolute() {
        return Err("Path must be absolute".to_string());
    }
    let canonical = path_buf.canonicalize().map_err(|_| "Invalid path".to_string())?;
    if !canonical.is_dir() {
        return Err("Path must be a directory".to_string());
    }

    if let Ok(home) = app.path().home_dir() {
        if canonical.starts_with(&home) {
            return Ok(canonical);
        }
    }

    if let Ok(downloads) = app.path().download_dir() {
        if canonical.starts_with(&downloads) {
            return Ok(canonical);
        }
    }

    Err("Path not allowed".to_string())
}

fn validate_show_in_folder_path(
    path: &str,
    app: &AppHandle,
    state: &DownloadManager,
) -> Result<std::path::PathBuf, String> {
    let path_buf = std::path::PathBuf::from(path);
    if !path_buf.is_absolute() {
        return Err("Path must be absolute".to_string());
    }
    if path.contains("\0") || path.starts_with("http://") || path.starts_with("https://") {
        return Err("Invalid path".to_string());
    }

    let canonical = path_buf.canonicalize().map_err(|_| "Invalid path".to_string())?;
    if !canonical.exists() {
        return Err("Path does not exist".to_string());
    }

    let tasks = state.tasks.lock().map_err(|_| "State lock error".to_string())?;
    let allowed = tasks.values().any(|t| {
        let task = t.lock().unwrap();
        if let Some(ref final_path) = task.final_path {
            if canonical == *final_path {
                return true;
            }
            if let Some(parent) = final_path.parent() {
                return canonical == parent;
            }
        }
        false
    });

    if allowed {
        return Ok(canonical);
    }

    if let Ok(home) = app.path().home_dir() {
        if canonical.starts_with(&home) {
            return Ok(canonical);
        }
    }

    Err("Path not allowed".to_string())
}

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
    validate_url(&url)?;
    if let Some(ref spec) = format_spec {
        validate_format_spec(spec)?;
    }
    let path = if let Some(ref p) = path {
        Some(validate_download_path(p, &app)?.to_string_lossy().to_string())
    } else {
        None
    };

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
    validate_url(&url)?;
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
pub async fn show_in_folder(
    app: AppHandle,
    state: State<'_, DownloadManager>,
    path: String,
) -> Result<(), String> {
    let path_buf = validate_show_in_folder_path(&path, &app, &state)?;
    let is_file = path_buf.is_file();
    let path_str = path_buf.to_string_lossy();

    #[cfg(target_os = "macos")]
    {
        let mut cmd = std::process::Command::new("open");
        if is_file {
            cmd.arg("-R");
        }
        cmd.arg(path_str.as_ref())
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        if is_file {
            std::process::Command::new("explorer")
                .arg("/select,")
                .arg(path_str.as_ref())
                .spawn()
                .map_err(|e| e.to_string())?;
        } else {
            std::process::Command::new("explorer")
                .arg(path_str.as_ref())
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
            path_str.to_string()
        };

        std::process::Command::new("xdg-open")
            .arg(&target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_available_space(path: String, app: AppHandle) -> Result<u64, String> {
    let p = if path.is_empty() {
        app.path().home_dir()
            .or_else(|_| app.path().download_dir())
            .map_err(|e| format!("Could not determine path: {}", e))?
            .to_string_lossy()
            .to_string()
    } else {
        let validated = validate_download_path(&path, &app)?;
        validated.to_string_lossy().to_string()
    };

    let space = fs2::available_space(&p).map_err(|e| e.to_string())?;
    Ok(space)
}
