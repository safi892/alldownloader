use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use std::sync::{Arc, Mutex};
use std::io::Write;
use std::fs;
use tauri::{AppHandle, Emitter, Runtime};
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandEvent;

#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(rename_all = "lowercase")] // active, paused, error, etc
pub enum DownloadStatus {
    Queued,
    Downloading,
    Paused,
    Completed,
    Error,
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
    pub speed: String,
    pub eta: String,
    pub status: DownloadStatus,
    pub total_size: Option<String>,
}

pub struct DownloadManager {
    // Map<download_id, process_id_or_handle>
    // Since we use tauri_plugin_shell, we might need to store the Child process.
    // However, the plugin doesn't easily expose the raw Child in a way we can 'kill' later generically without keeping the Child struct.
    // For now, let's just store active task IDs to prevent duplicates, and we'll implement cancellation if the plugin supports it (it returns a handle).
    active_downloads: Arc<Mutex<HashMap<String, ()>>>, 
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            active_downloads: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub async fn get_video_metadata<R: Runtime>(&self, app: AppHandle<R>, url: String) -> Result<VideoMetadata, String> {
        let output = app.shell().command("yt-dlp")
            .args(["-J", "--flat-playlist", &url]) // flat-playlist is faster for large lists
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

    pub fn start_download<R: Runtime>(&self, app: AppHandle<R>, url: String, id: String, path: Option<String>, format_spec: Option<String>, cookies: Option<String>) {
        let active_downloads = self.active_downloads.clone();
        
        {
            let mut map = active_downloads.lock().unwrap();
            if map.contains_key(&id) {
                return; // Already active
            }
            map.insert(id.clone(), ());
        }

        tauri::async_runtime::spawn(async move {
            let mut args = vec![
                "--newline",
                "-N", "8",
                "--progress-template",
                "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_estimate_str)s",
            ];

            // Cookie Handling
            let mut cookie_file_path = None;
            if let Some(cookie_data) = cookies {
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

            // If it's a playlist, we want to download the whole thing
            // yt-dlp does this by default if we don't pass --no-playlist.

            // Metadata & Thumbnail
            args.push("--add-metadata");
            args.push("--embed-thumbnail");

            // Path logic
            let path_string;
            if let Some(p) = &path {
                path_string = p.clone();
                args.push("-P");
                args.push(&path_string);
            }

            // Format Logic
            let format_arg;
            if let Some(spec) = format_spec {
                if spec == "audio" {
                    args.push("-x");
                    args.push("--audio-format");
                    args.push("mp3");
                } else {
                    // Assume spec is a format_id (e.g. "137")
                    // We append +bestaudio to ensure we get sound
                    // Unless it's already a combined format, but +bestaudio is usually safe for video-only streams
                    format_arg = format!("{}+bestaudio/best", spec);
                    args.push("-f");
                    args.push(&format_arg);
                    // Force merge to mp4/mkv if needed? 
                    // args.push("--merge-output-format");
                    // args.push("mp4");
                }
            }
            
            args.push(&url);

            let sidecar_command = app.shell().command("yt-dlp")
                .args(args);

            match sidecar_command.spawn() {
                Ok((mut rx, mut _child)) => {
                    while let Some(event) = rx.recv().await {
                         match event {
                            CommandEvent::Stdout(line) => {
                                let line_str = String::from_utf8_lossy(&line);
                                let parts: Vec<&str> = line_str.split('|').collect();
                                if parts.len() >= 3 {
                                    let percent_str = parts[0].trim().replace("%", "");
                                    let speed = parts[1].trim().to_string();
                                    let eta = parts[2].trim().to_string();
                                    let total_size = if parts.len() >= 4 {
                                        Some(parts[3].trim().to_string())
                                    } else {
                                        None
                                    };

                                    if let Ok(progress) = percent_str.parse::<f64>() {
                                        let payload = DownloadProgressPayload {
                                            id: id.clone(),
                                            progress,
                                            speed,
                                            eta,
                                            status: DownloadStatus::Downloading,
                                            total_size,
                                        };
                                        let _ = app.emit("download-progress", payload);
                                    }
                                }
                            }
                            CommandEvent::Terminated(payload) => {
                                 let status = if payload.code == Some(0) {
                                     DownloadStatus::Completed
                                 } else {
                                     DownloadStatus::Error
                                 };
                                 
                                 let final_payload = DownloadProgressPayload {
                                    id: id.clone(),
                                    progress: 100.0,
                                    speed: "-".to_string(),
                                    eta: "-".to_string(),
                                    status,
                                    total_size: None, // Keep last known? Or just None
                                 };
                                 let _ = app.emit("download-progress", final_payload);
                                 
                                 let mut map = active_downloads.lock().unwrap();
                                 map.remove(&id);

                                 // Cleanup cookies
                                 if let Some(ref path) = cookie_file_path {
                                     let _ = fs::remove_file(path);
                                 }
                            }
                            _ => {}
                        }
                    }
                }
                Err(e) => {
                    let payload = DownloadProgressPayload {
                        id: id.clone(),
                        progress: 0.0,
                        speed: "-".to_string(),
                        eta: "-".to_string(),
                        status: DownloadStatus::Error,
                        total_size: None,
                    };
                    let _ = app.emit("download-progress", payload);
                    eprintln!("Failed to spawn yt-dlp: {}", e);
                    
                    let mut map = active_downloads.lock().unwrap();
                    map.remove(&id);

                    // Cleanup cookies
                    if let Some(ref path) = cookie_file_path {
                        let _ = fs::remove_file(path);
                    }
                }
            }
        });
    }
}
