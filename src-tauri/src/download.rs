use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::io::Write;
use std::fs;
use tauri::{AppHandle, Emitter, Runtime, Manager};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;
#[cfg(mobile)]
pub type Child = (); 
#[cfg(not(mobile))]
pub use tauri_plugin_shell::process::CommandChild as Child;


#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum DownloadStatus {
    Queued,
    Preparing,
    Downloading,
    Paused,
    Merging,
    Completed,
    Error,
    Cancelled,
}

impl DownloadStatus {
    pub fn can_transition_to(&self, next: &DownloadStatus) -> bool {
        match (self, next) {
            (DownloadStatus::Queued, DownloadStatus::Preparing) => true,
            (DownloadStatus::Queued, DownloadStatus::Cancelled) => true,
            (DownloadStatus::Preparing, DownloadStatus::Downloading) => true,
            (DownloadStatus::Preparing, DownloadStatus::Error) => true,
            (DownloadStatus::Preparing, DownloadStatus::Cancelled) => true,
            (DownloadStatus::Downloading, DownloadStatus::Merging) => true,
            (DownloadStatus::Downloading, DownloadStatus::Paused) => true,
            (DownloadStatus::Downloading, DownloadStatus::Completed) => true,
            (DownloadStatus::Downloading, DownloadStatus::Error) => true,
            (DownloadStatus::Downloading, DownloadStatus::Cancelled) => true,
            (DownloadStatus::Paused, DownloadStatus::Downloading) => true,
            (DownloadStatus::Paused, DownloadStatus::Cancelled) => true,
            (DownloadStatus::Merging, DownloadStatus::Completed) => true,
            (DownloadStatus::Merging, DownloadStatus::Error) => true,
            (DownloadStatus::Merging, DownloadStatus::Cancelled) => true,
            // Terminal states stay terminal unless retried (which creates a new task or reset)
            _ => false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFormat {
    pub format_id: String,
    pub ext: String,
    pub resolution: Option<String>,
    pub width: Option<u64>,
    pub height: Option<u64>,
    pub fps: Option<f64>,
    pub filesize: Option<u64>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub note: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlaylistEntry {
    pub id: String,
    pub title: String,
    pub url: String,
    pub duration: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
    pub id: String,
    pub title: String,
    pub thumbnail: String,
    pub webpage_url: String,
    pub duration: Option<f64>,
    pub formats: Vec<VideoFormat>,
    pub is_playlist: bool,
    pub entries: Option<Vec<PlaylistEntry>>,
}

#[derive(Clone, Serialize, Deserialize, Debug)]
pub struct DownloadProgressPayload {
    pub id: String,
    pub progress: f64,
    pub speed: Option<u64>,
    pub eta: Option<u64>,
    pub status: DownloadStatus,
    pub total_size: Option<u64>,
    pub downloaded_bytes: Option<u64>,
    pub can_retry: Option<bool>,
    pub error_message: Option<String>,
    pub final_path: Option<String>,
    pub version: u32, // IPC Versioning
}

pub struct DownloadManager {
    // Authoritative store of all tasks
    pub tasks: Arc<Mutex<HashMap<String, Arc<Mutex<DownloadTask>>>>>,
    pub max_concurrent: usize,
}

pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub title: String,
    pub status: DownloadStatus,
    pub progress: f64,
    pub speed: Option<u64>,
    pub eta: Option<u64>,
    pub total_size: Option<u64>,
    pub downloaded_bytes: Option<u64>,
    pub child: Option<Child>,
    pub final_path: Option<std::path::PathBuf>,
}

impl DownloadTask {
    pub fn new(id: String, url: String, title: String) -> Self {
        Self {
            id,
            url,
            title,
            status: DownloadStatus::Queued,
            progress: 0.0,
            speed: None,
            eta: None,
            total_size: None,
            downloaded_bytes: None,
            child: None,
            final_path: None,
        }
    }

    pub fn transition(&mut self, next: DownloadStatus) -> bool {
        if self.status.can_transition_to(&next) || self.status == next {
            self.status = next;
            true
        } else {
            false
        }
    }
}

pub async fn verify_media_integrity<R: Runtime>(app: &AppHandle<R>, path: &std::path::Path) -> Result<(), String> {
    // 1. Basic check: Existence and non-zero size
    if !path.exists() {
        return Err("Output file does not exist".to_string());
    }
    let metadata = fs::metadata(path).map_err(|e| e.to_string())?;
    if metadata.len() == 0 {
        return Err("Output file is empty".to_string());
    }

    // 2. Rigorous check: ffprobe container validity
    let output = app.shell().sidecar("bin/ffprobe")
        .map_err(|e| e.to_string())?
        .args(["-v", "error", "-show_format", "-show_streams", &path.to_string_lossy()])
        .output()
        .await
        .map_err(|e| format!("Failed to execute ffprobe: {}", e))?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("Corrupt media container detected: {}", stderr));
    }

    Ok(())
}

pub struct Guardrails {
    pub max_concurrent_downloads: usize,
    pub max_playlist_items: u32,
    pub default_fragments: u32,
    pub ipc_version: u32,
}

pub const SYSTEM_GUARDRAILS: Guardrails = Guardrails {
    max_concurrent_downloads: 2,
    max_playlist_items: 100,
    default_fragments: 8,
    ipc_version: 1,
};

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            max_concurrent: SYSTEM_GUARDRAILS.max_concurrent_downloads,
        }
    }

    pub async fn get_video_metadata<R: Runtime>(&self, app: AppHandle<R>, url: String) -> Result<VideoMetadata, String> {
        let max_items = SYSTEM_GUARDRAILS.max_playlist_items.to_string();
        let output = app.shell().sidecar("bin/yt-dlp")
            .map_err(|e| e.to_string())?
            .args(["-J", "--flat-playlist", "--no-warnings", "--playlist-end", &max_items, &url])
            .output()
            .await
            .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(format!("yt-dlp failed: {}", stderr));
        }

        let json_str = String::from_utf8_lossy(&output.stdout);
        let v: serde_json::Value = serde_json::from_str(&json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;

        let is_playlist = v["_type"].as_str() == Some("playlist");
        
        let id = v["id"].as_str().unwrap_or_default().to_string();
        let title = v["title"].as_str().unwrap_or_default().to_string();
        let thumbnail = v["thumbnail"].as_str().unwrap_or(
            v["thumbnails"].as_array().and_then(|a| a.last()).and_then(|t| t["url"].as_str()).unwrap_or_default()
        ).to_string();
        let duration = v["duration"].as_f64();

        let mut formats = Vec::new();
        let mut entries = Vec::new();

        if is_playlist {
            if let Some(arr) = v["entries"].as_array() {
                for entry in arr {
                    entries.push(PlaylistEntry {
                        id: entry["id"].as_str().unwrap_or_default().to_string(),
                        title: entry["title"].as_str().unwrap_or_default().to_string(),
                        url: entry["url"].as_str().unwrap_or_default().to_string(),
                        duration: entry["duration"].as_f64(),
                    });
                }
            }
        } else {
            if let Some(arr) = v["formats"].as_array() {
                for f in arr {
                    let format_id = f["format_id"].as_str().unwrap_or_default().to_string();
                    let ext = f["ext"].as_str().unwrap_or_default().to_string();
                    let width = f["width"].as_u64();
                    let height = f["height"].as_u64();
                    let fps = f["fps"].as_f64();
                    let filesize = f["filesize"].as_u64().or(f["filesize_approx"].as_u64());
                    let vcodec = f["vcodec"].as_str().map(|s| s.to_string());
                    let acodec = f["acodec"].as_str().map(|s| s.to_string());
                    let resolution = f["resolution"].as_str().map(|s| s.to_string());
                    let note = f["format_note"].as_str().map(|s| s.to_string());
    
                    formats.push(VideoFormat {
                        format_id,
                        ext,
                        resolution,
                        width,
                        height,
                        fps,
                        filesize,
                        vcodec,
                        acodec,
                        note,
                    });
                }
            }
        }

        let webpage_url = v["webpage_url"].as_str().unwrap_or(&url).to_string();

        Ok(VideoMetadata {
            id,
            title,
            thumbnail,
            webpage_url,
            duration,
            formats,
            is_playlist,
            entries: if is_playlist { Some(entries) } else { None },
        })
    }

    pub fn cancel_download(&self, id: &str) -> bool {
        let tasks = self.tasks.lock().unwrap();
        if let Some(task_arc) = tasks.get(id) {
            let mut task = task_arc.lock().unwrap();
            if let Some(child) = task.child.take() {
                #[cfg(windows)]
                {
                    let pid = child.pid();
                    let _ = std::process::Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &pid.to_string()])
                        .spawn();
                }
                #[cfg(not(windows))]
                {
                    let _ = child.kill();
                }
            }
            let _ = task.transition(DownloadStatus::Cancelled);
            true
        } else {
            false
        }
    }

    pub fn pause_download(&self, id: &str) -> bool {
        let tasks = self.tasks.lock().unwrap();
        if let Some(task_arc) = tasks.get(id) {
            let mut task = task_arc.lock().unwrap();
            
            // Only pause if downloading
            if task.status != DownloadStatus::Downloading {
                return false;
            }

            if let Some(child) = &task.child {
                #[cfg(unix)]
                {
                    let pid = child.pid();
                    let _ = std::process::Command::new("kill")
                        .args(["-STOP", &pid.to_string()])
                        .spawn();
                    let _ = task.transition(DownloadStatus::Paused);
                    return true;
                }
                #[cfg(windows)]
                {
                    // Generic Windows pause is hard without specialized APIs, 
                    // we could kill but yt-dlp resume is handled by restarting.
                    // For now we just return false or implement tree-suspend.
                    false
                }
            } else {
                false
            }
        } else {
            false
        }
    }

    pub fn resume_download(&self, id: &str) -> bool {
        let tasks = self.tasks.lock().unwrap();
        if let Some(task_arc) = tasks.get(id) {
            let mut task = task_arc.lock().unwrap();
            
            if task.status != DownloadStatus::Paused {
                return false;
            }

            if let Some(child) = &task.child {
                #[cfg(unix)]
                {
                    let pid = child.pid();
                    let _ = std::process::Command::new("kill")
                        .args(["-CONT", &pid.to_string()])
                        .spawn();
                    let _ = task.transition(DownloadStatus::Downloading);
                    return true;
                }
                #[cfg(windows)]
                {
                    false
                }
            } else {
                false
            }
        } else {
            false
        }
    }

    pub fn cleanup_all(&self) {
        let tasks = self.tasks.lock().unwrap();
        for (_, task_arc) in tasks.iter() {
            let mut task = task_arc.lock().unwrap();
            if let Some(child) = task.child.take() {
                #[cfg(windows)]
                {
                    let pid = child.pid();
                    let _ = std::process::Command::new("taskkill")
                        .args(["/F", "/T", "/PID", &pid.to_string()])
                        .spawn();
                }
                #[cfg(not(windows))]
                {
                    let _ = child.kill();
                }
            }
        }
    }

    pub fn get_tasks(&self) -> Vec<DownloadProgressPayload> {
        let tasks = self.tasks.lock().unwrap();
        tasks.values().map(|t| {
            let task = t.lock().unwrap();
            DownloadProgressPayload {
                id: task.id.clone(),
                progress: task.progress,
                speed: task.speed,
                eta: task.eta,
                status: task.status.clone(),
                total_size: task.total_size,
                downloaded_bytes: task.downloaded_bytes,
                can_retry: Some(task.status == DownloadStatus::Error),
                error_message: None,
                final_path: task.final_path.as_ref().map(|p| p.to_string_lossy().to_string()),
                version: SYSTEM_GUARDRAILS.ipc_version,
            }
        }).collect()
    }

    pub fn start_download<R: Runtime>(&self, app: AppHandle<R>, url: String, id: String, title: String, path: Option<String>, format_spec: Option<String>, cookies: Option<String>) {
        let _tasks_clone = self.tasks.clone();
        
        {
            let mut map = self.tasks.lock().unwrap();
            if map.contains_key(&id) {
                return; // Already exists
            }
            map.insert(id.clone(), Arc::new(Mutex::new(DownloadTask::new(id.clone(), url.clone(), title))));
        }

        let _app_clone = app.clone();
        let _download_manager = app.state::<DownloadManager>();
        
        // Signal the queue to process
        self.process_queue(app, path, format_spec, cookies);
    }

    pub fn process_queue<R: Runtime>(&self, app: AppHandle<R>, path: Option<String>, format_spec: Option<String>, cookies: Option<String>) {
        let tasks_arc = self.tasks.clone();
        let max_concurrent = self.max_concurrent;

        let active_count = {
            let tasks = tasks_arc.lock().unwrap();
            tasks.values().filter(|t| {
                let task = t.lock().unwrap();
                matches!(task.status, DownloadStatus::Preparing | DownloadStatus::Downloading | DownloadStatus::Merging)
            }).count()
        };

        if active_count >= max_concurrent {
            return;
        }

        let next_task_id = {
            let tasks = tasks_arc.lock().unwrap();
            tasks.iter().find(|(_, t)| {
                let task = t.lock().unwrap();
                task.status == DownloadStatus::Queued
            }).map(|(id, _)| id.clone())
        };

        if let Some(id) = next_task_id {
            let task_ref = {
                let tasks = tasks_arc.lock().unwrap();
                tasks.get(&id).unwrap().clone()
            };

            {
                let mut task = task_ref.lock().unwrap();
                if !task.transition(DownloadStatus::Preparing) {
                    return;
                }
            }

            // Start the actual download in a spawn
            let app_inner = app.clone();
            let url_inner = {
                let task = task_ref.lock().unwrap();
                task.url.clone()
            };

            tauri::async_runtime::spawn(async move {
                let fragments = SYSTEM_GUARDRAILS.default_fragments.to_string();
                let mut args = vec![
                    "--newline",
                    "-N", &fragments,
                    "--progress-template",
                    "%(progress.downloaded_bytes)s|%(progress.total_bytes)s|%(progress.speed)s|%(progress.eta)s",
                    "--no-warnings",
                ];

                // Cookie Handling
                let mut cookie_file_path = None;
                if let Some(ref cookie_data) = cookies {
                    let temp_dir = std::env::temp_dir();
                    let file_path = temp_dir.join(format!("vidflow_cookies_{}.txt", id));
                    if let Ok(mut file) = fs::File::create(&file_path) {
                        if file.write_all(cookie_data.as_bytes()).is_ok() {
                            cookie_file_path = Some(file_path.to_string_lossy().to_string());
                        }
                    }
                }

                let cookie_arg;
                if let Some(ref path) = cookie_file_path {
                    cookie_arg = path.clone();
                    args.push("--cookies");
                    args.push(&cookie_arg);
                }

                args.push("--add-metadata");
                args.push("--embed-thumbnail");

                let path_string;
                if let Some(p) = &path {
                    path_string = p.clone();
                    args.push("-P");
                    args.push(&path_string);
                }

                let format_arg;
                if let Some(ref spec) = format_spec {
                    if spec == "audio" {
                        args.push("-x");
                        args.push("--audio-format");
                        args.push("mp3");
                    } else {
                        format_arg = format!("{}+bestaudio/best", spec);
                        args.push("-f");
                        args.push(&format_arg);
                        args.push("--merge-output-format");
                        args.push("mp4/mkv");
                    }
                }
                
                args.push(&url_inner);

                let sidecar_command = app_inner.shell().sidecar("bin/yt-dlp").map_err(|e| e.to_string()).expect("Failed to create sidecar command").args(args);

                match sidecar_command.spawn() {
                    Ok((mut rx, child)) => {
                        {
                            let mut task = task_ref.lock().unwrap();
                            task.child = Some(child);
                            let _ = task.transition(DownloadStatus::Downloading);
                        }

                        while let Some(event) = rx.recv().await {
                             match event {
                                CommandEvent::Stdout(line) => {
                                    let line_str = String::from_utf8_lossy(&line);
                                    
                                    if line_str.contains("[download] Destination:") {
                                        let path_part = line_str.split("Destination:").nth(1).unwrap_or("").trim();
                                        if !path_part.is_empty() {
                                            let mut task = task_ref.lock().unwrap();
                                            task.final_path = Some(std::path::PathBuf::from(path_part));
                                        }
                                    }

                                    if line_str.contains("[Merger] Merging formats into") {
                                        let path_part = line_str.split("formats into").nth(1).unwrap_or("").trim().trim_matches('"');
                                        if !path_part.is_empty() {
                                            let mut task = task_ref.lock().unwrap();
                                            task.final_path = Some(std::path::PathBuf::from(path_part));
                                        }
                                    }

                                    if line_str.contains("has already been downloaded") && line_str.contains("[download]") {
                                        let path_part = line_str.split("[download]").nth(1).unwrap_or("")
                                            .split("has already been downloaded").nth(0).unwrap_or("").trim().trim_matches('"');
                                        if !path_part.is_empty() {
                                            let mut task = task_ref.lock().unwrap();
                                            task.final_path = Some(std::path::PathBuf::from(path_part));
                                        }
                                    }

                                    if line_str.contains("[Merger]") {
                                        let mut task = task_ref.lock().unwrap();
                                        let _ = task.transition(DownloadStatus::Merging);
                                        
                                        let final_path = {
                                            let task = task_ref.lock().unwrap();
                                            task.final_path.as_ref().map(|p| p.to_string_lossy().to_string())
                                        };
                                        
                                        let payload = DownloadProgressPayload {
                                            id: id.clone(),
                                            progress: 100.0,
                                            speed: None,
                                            eta: None,
                                            status: DownloadStatus::Merging,
                                            total_size: None,
                                            downloaded_bytes: None,
                                            can_retry: Some(false),
                                            error_message: None,
                                            final_path,
                                            version: SYSTEM_GUARDRAILS.ipc_version,
                                        };
                                        let _ = app_inner.emit("download-progress", payload);
                                        continue;
                                    }

                                    let parts: Vec<&str> = line_str.split('|').collect();
                                    if parts.len() >= 4 {
                                        let downloaded = parts[0].trim().parse::<u64>().unwrap_or(0);
                                        let total = parts[1].trim().parse::<u64>().unwrap_or(0);
                                        // Speed comes as decimal from yt-dlp, parse as f64 then convert
                                        let speed = parts[2].trim().parse::<f64>().ok().map(|s| s as u64);
                                        let eta = parts[3].trim().parse::<u64>().ok();

                                        let progress = if total > 0 {
                                            (downloaded as f64 / total as f64) * 100.0
                                        } else {
                                            0.0
                                        };

                                        {
                                            let mut task = task_ref.lock().unwrap();
                                            task.progress = progress;
                                            task.speed = speed;
                                            task.eta = eta;
                                            task.total_size = if total > 0 { Some(total) } else { None };
                                            task.downloaded_bytes = Some(downloaded);
                                        }

                                        let final_path = {
                                            let task = task_ref.lock().unwrap();
                                            task.final_path.as_ref().map(|p| p.to_string_lossy().to_string())
                                        };

                                        let payload = DownloadProgressPayload {
                                            id: id.clone(),
                                            progress,
                                            speed,
                                            eta,
                                            status: DownloadStatus::Downloading,
                                            total_size: if total > 0 { Some(total) } else { None },
                                            downloaded_bytes: Some(downloaded),
                                            can_retry: Some(false),
                                            error_message: None,
                                            final_path,
                                            version: SYSTEM_GUARDRAILS.ipc_version,
                                        };
                                        let _ = app_inner.emit("download-progress", payload);
                                    }
                                }
                                CommandEvent::Terminated(payload) => {
                                      let (current_status, final_path) = {
                                         let mut task = task_ref.lock().unwrap();
                                         let s = task.status.clone();
                                         let p = task.final_path.clone();
                                         task.child = None;
                                         (s, p)
                                      };
                                      
                                      let status = if payload.code == Some(0) {
                                          if let Some(ref path) = final_path {
                                              match verify_media_integrity(&app_inner, path).await {
                                                  Ok(_) => {
                                                      let mut task = task_ref.lock().unwrap();
                                                      let _ = task.transition(DownloadStatus::Completed);
                                                      DownloadStatus::Completed
                                                  }
                                                  Err(e) => {
                                                      println!("Verification failed: {}", e);
                                                      let mut task = task_ref.lock().unwrap();
                                                      let _ = task.transition(DownloadStatus::Error);
                                                      DownloadStatus::Error
                                                  }
                                              }
                                          } else {
                                              let mut task = task_ref.lock().unwrap();
                                              let _ = task.transition(DownloadStatus::Error);
                                              DownloadStatus::Error
                                          }
                                      } else if current_status == DownloadStatus::Cancelled {
                                          DownloadStatus::Cancelled
                                      } else {
                                          let mut task = task_ref.lock().unwrap();
                                          let _ = task.transition(DownloadStatus::Error);
                                          DownloadStatus::Error
                                      };

                                     // Explicit cleanup
                                     if status == DownloadStatus::Cancelled || status == DownloadStatus::Error {
                                         let dest = {
                                             let task = task_ref.lock().unwrap();
                                             task.final_path.clone()
                                         };
                                         if let Some(dest) = dest {
                                             let _ = fs::remove_file(format!("{}.part", dest.display()));
                                             let _ = fs::remove_file(format!("{}.ytdl", dest.display()));
                                         }
                                     }
                                     
                                     let final_payload = DownloadProgressPayload {
                                        id: id.clone(),
                                        progress: if status == DownloadStatus::Completed { 100.0 } else { 0.0 },
                                        speed: None,
                                        eta: None,
                                        status: status.clone(),
                                        total_size: None,
                                        downloaded_bytes: None,
                                        can_retry: Some(status == DownloadStatus::Error),
                                        error_message: if status == DownloadStatus::Error { Some("Download failed".to_string()) } else { None },
                                        final_path: final_path.map(|p| p.to_string_lossy().to_string()),
                                        version: SYSTEM_GUARDRAILS.ipc_version,
                                     };
                                     let _ = app_inner.emit("download-progress", final_payload);
                                     
                                     if let Some(ref path) = cookie_file_path {
                                         let _ = fs::remove_file(path);
                                     }

                                     // Process next in queue
                                     let manager = app_inner.state::<DownloadManager>();
                                     
                                     // Trigger persistence save
                                     if let Some(persistence) = app_inner.try_state::<crate::persistence::PersistenceManager>() {
                                         let _ = persistence.save_tasks(&manager.tasks.lock().unwrap());
                                     }

                                     manager.process_queue(app_inner.clone(), path.clone(), format_spec.clone(), cookies.clone());
                                     
                                     return;
                                }
                                _ => {}
                            }
                        }
                    }
                    Err(_) => {
                        {
                            let mut task = task_ref.lock().unwrap();
                            let _ = task.transition(DownloadStatus::Error);
                        }
                        let payload = DownloadProgressPayload {
                            id: id.clone(),
                            progress: 0.0,
                            speed: None,
                            eta: None,
                            status: DownloadStatus::Error,
                            total_size: None,
                            downloaded_bytes: None,
                            can_retry: Some(true),
                            error_message: Some("Failed to start process".to_string()),
                            final_path: None,
                            version: SYSTEM_GUARDRAILS.ipc_version,
                        };
                        let _ = app_inner.emit("download-progress", payload);
                        
                        if let Some(ref path) = cookie_file_path {
                            let _ = fs::remove_file(path);
                        }

                        let manager = app_inner.state::<DownloadManager>();
                        
                        // Trigger persistence save
                        if let Some(persistence) = app_inner.try_state::<crate::persistence::PersistenceManager>() {
                            let _ = persistence.save_tasks(&manager.tasks.lock().unwrap());
                        }

                        manager.process_queue(app_inner.clone(), path, format_spec, cookies);
                    }
                }
            });
        }
    }
}

