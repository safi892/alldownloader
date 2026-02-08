import { invoke } from "@tauri-apps/api/core";
import { IDownloadService, Download, VideoMetadata } from "@/types/download";

export class TauriDownloadService implements IDownloadService {
    async getVideoMetadata(url: string): Promise<VideoMetadata> {
        return await invoke<VideoMetadata>("get_video_metadata", { url });
    }

    async startDownload(url: string, options?: { path?: string | null, format?: string | null, cookies?: string | null }): Promise<string> {
        return await invoke<string>("start_download", {
            url,
            path: options?.path,
            formatSpec: options?.format,
            cookies: options?.cookies
        });
    }

    async pauseDownload(_id: string): Promise<void> {
        // Backend command implementation pending, for now just invoke
        // await invoke("pause_download", { id });
        console.warn("Pause not fully implemented in backend yet");
    }

    async resumeDownload(_id: string): Promise<void> {
        // await invoke("resume_download", { id });
        console.warn("Resume not fully implemented in backend yet");
    }

    async cancelDownload(id: string): Promise<void> {
        await invoke("cancel_download", { id });
    }

    async listDownloads(): Promise<Download[]> {
        return [];
    }

    async showInFolder(path: string): Promise<void> {
        await invoke('show_in_folder', { path });
    }
}

export const downloadService = new TauriDownloadService();
