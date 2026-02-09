import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { listen } from "@tauri-apps/api/event";
import {
    isPermissionGranted,
    requestPermission,
    sendNotification
} from '@tauri-apps/plugin-notification';
import { Download, IDownloadService, DownloadProgressPayload, VideoMetadata } from "@/types/download";
import { TauriDownloadService } from "@/services/TauriDownloadService";
import { formatBytes, formatSpeed, formatETA } from "@/utils/formatUtils";

// Use real service
const api: IDownloadService = new TauriDownloadService();

interface AnalysisContext {
    url: string;
    metadata: VideoMetadata;
}

interface DownloadState {
    tasks: Download[];
    isLoading: boolean;
    error: string | null;
    downloadPath: string | null;

    // Analysis State
    isAnalyzing: boolean;
    analysisCtx: AnalysisContext | null;
    prefillUrl: string | null;

    // Settings
    settings: {
        maxConcurrent: number;
        concurrencyMode: boolean; // true = limit enabled
        cookies: string | null;
        theme: 'dark' | 'light' | 'system';
    };

    // Actions
    initializeListeners: () => Promise<void>;
    setDownloadPath: (path: string) => void;
    setPrefillUrl: (url: string | null) => void;
    updateSettings: (settings: Partial<DownloadState['settings']>) => void;

    analyzeUrl: (url: string) => Promise<void>;
    confirmDownload: (formatSpec: string) => Promise<void>;
    processQueue: () => Promise<void>;
    cancelAnalysis: () => void;

    pauseTask: (id: string) => Promise<void>;
    resumeTask: (id: string) => Promise<void>;
    retryTask: (id: string) => Promise<void>;
    cancelTask: (id: string) => Promise<void>;
    openFolder: (id: string) => Promise<void>;
}

export const useDownloadStore = create<DownloadState>()(
    persist(
        (set, get) => ({
            tasks: [],
            isLoading: false,
            error: null,
            downloadPath: null,
            isAnalyzing: false,
            analysisCtx: null,
            prefillUrl: null,
            settings: {
                maxConcurrent: 2,
                concurrencyMode: true,
                cookies: null,
                theme: 'dark'
            },

            setPrefillUrl: (url) => set({ prefillUrl: url }),

            updateSettings: (newSettings) => {
                set(state => {
                    const nextSettings = { ...state.settings, ...newSettings };

                    // Apply theme immediately if it's part of the change
                    if (newSettings.theme) {
                        const root = window.document.documentElement;
                        const theme = newSettings.theme;
                        if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                            root.classList.add('dark');
                        } else {
                            root.classList.remove('dark');
                        }
                    }

                    return { settings: nextSettings };
                });
            },

            initializeListeners: async () => {
                // Apply theme on init
                const store = get();
                const root = window.document.documentElement;
                const theme = store.settings.theme;

                if (theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }

                console.log("Initializing Tauri Event Listeners...");

                // Notification Setup
                let hasPermission = await isPermissionGranted();
                if (!hasPermission) {
                    const permission = await requestPermission();
                    hasPermission = permission === 'granted';
                }
                const progressBuffer = new Map<string, DownloadProgressPayload>();
                let updateTimer: any = null;

                const flushUpdates = () => {
                    if (progressBuffer.size === 0) return;
                    set((state) => {
                        const newTasks = [...state.tasks];
                        let updated = false;
                        progressBuffer.forEach((payload, id) => {
                            const idx = newTasks.findIndex(t => t.id === id);
                            if (idx !== -1) {
                                newTasks[idx] = {
                                    ...newTasks[idx],
                                    progress: payload.progress,
                                    speed: formatSpeed(payload.speed),
                                    eta: formatETA(payload.eta),
                                    status: payload.status,
                                    totalSize: formatBytes(payload.total_size),
                                    downloadedBytes: payload.downloaded_bytes ?? newTasks[idx].downloadedBytes
                                };
                                updated = true;
                            }
                        });
                        progressBuffer.clear();
                        return updated ? { tasks: newTasks } : {};
                    });
                };

                await listen<DownloadProgressPayload>("download-progress", (event) => {
                    const payload = event.payload;

                    if (['completed', 'error', 'cancelled'].includes(payload.status)) {
                        set((state) => {
                            const idx = state.tasks.findIndex(t => t.id === payload.id);
                            if (idx === -1) return {};

                            const task = state.tasks[idx];
                            if (payload.status === 'completed' && task.status !== 'completed' && hasPermission) {
                                sendNotification({
                                    title: 'Download Complete',
                                    body: `"${task.title}" has been saved to your computer.`
                                });
                                setTimeout(() => get().processQueue(), 0);
                            }

                            const newTasks = [...state.tasks];
                            newTasks[idx] = {
                                ...task,
                                status: payload.status,
                                progress: payload.progress,
                                speed: formatSpeed(payload.speed),
                                eta: formatETA(payload.eta),
                                totalSize: formatBytes(payload.total_size),
                                error: payload.error_message || (payload.status === 'error' ? 'Download failed' : undefined)
                            };
                            return { tasks: newTasks };
                        });
                        progressBuffer.delete(payload.id);
                    } else {
                        progressBuffer.set(payload.id, payload);
                        if (!updateTimer) {
                            updateTimer = setInterval(flushUpdates, 200);
                        }
                    }
                });

                await listen<string>("binary-error", (event) => {
                    set({ error: event.payload });
                });
            },

            setDownloadPath: (path: string) => {
                set({ downloadPath: path });
            },

            analyzeUrl: async (url: string) => {
                if (!url) return;
                set({ isAnalyzing: true, error: null });
                try {
                    const metadata = await api.getVideoMetadata(url);
                    set({
                        isAnalyzing: false,
                        analysisCtx: { url, metadata }
                    });
                } catch (e) {
                    console.error(e);
                    set({ isAnalyzing: false, error: "Failed to fetch video metadata. Check URL or connection." });
                }
            },

            confirmDownload: async (formatSpec: string) => {
                const { analysisCtx, downloadPath } = get();
                if (!analysisCtx) return;

                set({ analysisCtx: null });

                // Principal Hardening: Pre-populate totalSize from metadata if possible
                let initialSize: string | undefined = undefined;
                if (formatSpec !== 'audio' && formatSpec !== 'best') {
                    const fmt = analysisCtx.metadata.formats.find(f => f.format_id === formatSpec);
                    if (fmt?.filesize) {
                        initialSize = formatBytes(fmt.filesize);
                    }
                }

                const newTask: Download = {
                    id: crypto.randomUUID(), // Proper UUID
                    url: analysisCtx.url,
                    sourceUrl: analysisCtx.metadata.webpage_url,
                    title: analysisCtx.metadata.title,
                    format: formatSpec === 'audio' ? 'audio' : 'video',
                    formatSpec: formatSpec,
                    downloadDir: downloadPath ?? undefined,
                    thumbnail: analysisCtx.metadata.thumbnail,
                    duration: analysisCtx.metadata.duration ?? undefined,
                    progress: 0,
                    status: "queued",
                    totalSize: initialSize
                };

                set((state) => ({
                    tasks: [newTask, ...state.tasks]
                }));

                await get().processQueue();
            },

            processQueue: async () => {
                const { tasks, settings } = get();
                if (!settings.concurrencyMode) return;

                const activeCount = tasks.filter(t =>
                    ['preparing', 'downloading', 'merging'].includes(t.status)
                ).length;

                if (activeCount < settings.maxConcurrent) {
                    const nextTask = tasks.find(t => t.status === 'queued');
                    if (nextTask) {
                        try {
                            // Move to preparing state
                            set(state => ({
                                tasks: state.tasks.map(t => t.id === nextTask.id ? { ...t, status: 'preparing' } : t)
                            }));

                            const realId = await api.startDownload(nextTask.url, {
                                title: nextTask.title || "Unknown Title",
                                path: nextTask.downloadDir,
                                format: nextTask.formatSpec,
                                cookies: settings.cookies
                            });

                            // Update to real ID from backend and set to downloading
                            // The backend starts immediately, so we move to downloading
                            set(state => ({
                                tasks: state.tasks.map(t => t.id === nextTask.id ? { ...t, id: realId, status: 'downloading' } : t)
                            }));
                        } catch (err) {
                            console.error("Queue start failed:", err);
                            set(state => ({
                                tasks: state.tasks.map(t => t.id === nextTask.id ? { ...t, status: 'error', error: 'Failed to start' } : t)
                            }));
                        }
                    }
                }
            },

            cancelAnalysis: () => {
                set({ analysisCtx: null, isAnalyzing: false, error: null });
            },

            pauseTask: async (id: string) => {
                await api.pauseDownload(id);
                set(state => ({
                    tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'paused' } : t)
                }));
            },

            resumeTask: async (id: string) => {
                await api.resumeDownload(id);
                set(state => ({
                    tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'downloading' } : t)
                }));
            },

            retryTask: async (id: string) => {
                const { tasks, downloadPath } = get();
                const task = tasks.find(t => t.id === id);
                if (!task) return;

                try {
                    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));

                    const settings = get().settings;
                    const newId = await api.startDownload(task.url, {
                        title: task.title || "Unknown Title",
                        path: downloadPath,
                        format: task.formatSpec,
                        cookies: settings.cookies
                    });

                    set((state) => ({
                        tasks: [
                            {
                                ...task,
                                id: newId,
                                status: 'queued',
                                progress: 0,
                                speed: undefined,
                                eta: undefined,
                                error: undefined
                            },
                            ...state.tasks
                        ]
                    }));
                } catch (e) {
                    console.error("Retry failed", e);
                }
            },

            cancelTask: async (id: string) => {
                await api.cancelDownload(id);
                set(state => ({
                    tasks: state.tasks.map(t => t.id === id ? { ...t, status: 'cancelled' } : t)
                }));
            },

            openFolder: async (id: string) => {
                const { tasks } = get();
                const task = tasks.find(t => t.id === id);
                if (task?.downloadDir) {
                    await api.showInFolder(task.downloadDir);
                } else {
                    // Fallback? Maybe strict no-op if no path.
                    // Or check global downloadPath?
                    const { downloadPath } = get();
                    if (downloadPath) {
                        await api.showInFolder(downloadPath);
                    }
                }
            }
        }),
        {
            name: "vidflow-storage",
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                tasks: state.tasks,
                downloadPath: state.downloadPath,
                settings: state.settings
            }),
        }
    )
);
