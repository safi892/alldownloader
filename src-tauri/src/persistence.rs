use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use crate::download::{DownloadTask, DownloadStatus};

#[derive(Serialize, Deserialize)]
pub struct PersistedTask {
    pub id: String,
    pub url: String,
    pub status: DownloadStatus,
    pub title: String,
    pub progress: f64,
    pub download_dir: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct PersistenceData {
    pub version: u32,
    pub tasks: Vec<PersistedTask>,
}

pub struct PersistenceManager {
    path: PathBuf,
}

impl PersistenceManager {
    pub fn new(app_dir: PathBuf) -> Self {
        let path = app_dir.join("tasks.json");
        Self { path }
    }

    pub fn save_tasks(&self, tasks: &HashMap<String, Arc<Mutex<DownloadTask>>>) -> Result<(), String> {
        let mut persisted_tasks = Vec::new();
        for task_arc in tasks.values() {
            let task = task_arc.lock().unwrap();
            persisted_tasks.push(PersistedTask {
                id: task.id.clone(),
                url: task.url.clone(),
                status: task.status.clone(),
                title: task.title.clone(),
                progress: task.progress,
                download_dir: task.final_path.as_ref().map(|p| p.to_string_lossy().to_string()),
            });
        }

        let data = PersistenceData {
            version: 1,
            tasks: persisted_tasks,
        };

        let json = serde_json::to_string_pretty(&data).map_err(|e| e.to_string())?;
        
        // Atomic Save Pattern: Write to temp file then rename
        let temp_path = self.path.with_extension("json.tmp");
        fs::write(&temp_path, json).map_err(|e| e.to_string())?;
        fs::rename(&temp_path, &self.path).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    pub fn load_tasks(&self) -> Result<Vec<PersistedTask>, String> {
        if !self.path.exists() {
            return Ok(Vec::new());
        }
        let json = fs::read_to_string(&self.path).map_err(|e| e.to_string())?;
        
        // Try to parse with versioning
        match serde_json::from_str::<PersistenceData>(&json) {
            Ok(data) => Ok(data.tasks),
            Err(_) => {
                // Fallback: try parsing the old format (Vec<PersistedTask>)
                match serde_json::from_str::<Vec<PersistedTask>>(&json) {
                    Ok(tasks) => Ok(tasks),
                    Err(e) => Err(format!("Failed to parse persistence file: {}", e)),
                }
            }
        }
    }
}
