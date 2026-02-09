export type DownloadStatus =
    | 'queued'
    | 'preparing'
    | 'downloading'
    | 'paused'
    | 'merging'
    | 'completed'
    | 'error'
    | 'cancelled';

export type DownloadFormat = 'video' | 'audio';

export interface Download {
    id: string;
    url: string;
    sourceUrl?: string; // Original site URL
    title?: string;
    format: DownloadFormat;
    progress: number;        // 0–100
    speed?: string;
    eta?: string;
    status: DownloadStatus;
    error?: string;
    formatSpec?: string;
    downloadDir?: string;
    thumbnail?: string;
    duration?: number;
    totalSize?: string;
    downloadedBytes?: number;
}

// Emitted from Backend to Frontend
export interface DownloadProgressPayload {
    id: string;
    progress: number;
    speed: number | null;     // Bytes per second
    eta: number | null;       // Seconds
    status: DownloadStatus;
    total_size: number | null; // Total bytes
    downloaded_bytes: number | null;
    can_retry?: boolean;
    error_message?: string;
    version: number;
}

export interface VideoFormat {
    format_id: string;
    ext: string;
    resolution: string | null;
    width: number | null;
    height: number | null;
    fps: number | null;
    filesize: number | null;
    vcodec: string | null;
    acodec: string | null;
    note: string | null;
}

export interface PlaylistEntry {
    id: string;
    title: string;
    url: string;
    duration: number | null;
}

export interface VideoMetadata {
    id: string;
    title: string;
    thumbnail: string;
    webpage_url: string;
    duration: number | null;
    formats: VideoFormat[];
    is_playlist?: boolean;
    entries?: PlaylistEntry[];
}

export interface IDownloadService {
    getVideoMetadata(url: string): Promise<VideoMetadata>;
    startDownload(url: string, options: { title: string, path?: string | null, format?: string | null, cookies?: string | null }): Promise<string>;
    pauseDownload(id: string): Promise<void>;
    resumeDownload(id: string): Promise<void>;
    cancelDownload(id: string): Promise<void>;
    listDownloads(): Promise<Download[]>;
    showInFolder(path: string): Promise<void>;
}
