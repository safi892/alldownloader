import { invoke } from "@tauri-apps/api/core";
import { IDownloadService, Download, VideoMetadata } from "@/types/download";

export class TauriDownloadService implements IDownloadService {
    async getVideoMetadata(url: string): Promise<VideoMetadata> {
        return await invoke<VideoMetadata>("get_video_metadata", { url });
    }

    async startDownload(url: string, options: { title: string, path?: string | null, format?: string | null, cookies?: string | null }): Promise<string> {
        return await invoke<string>("start_download", {
            url,
            title: options.title,
            path: options?.path,
            formatSpec: options?.format,
            cookies: options?.cookies
        });
    }

    async pauseDownload(id: string): Promise<void> {
        await invoke("pause_download", { id });
    }

    async resumeDownload(id: string): Promise<void> {
        await invoke("resume_download", { id });
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
