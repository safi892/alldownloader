import { memo } from "react";
import { Play, Pause, X, FileVideo, Music, RotateCcw, FolderOpen } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/ui/primitives/Button";
import { Download } from "@/types/download";
import { useDownloadStore } from "@/state/useDownloadStore";
import { motion, AnimatePresence } from "framer-motion";
import { getSiteInfo } from "@/utils/siteUtils";

interface DownloadItemProps {
    task: Download;
    index?: number;
}

const formatDuration = (seconds: number): string => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

export const DownloadItem = memo(({ task, index = 0 }: DownloadItemProps) => {
    const { pauseTask, resumeTask, removeTask, retryTask, openFolder } = useDownloadStore();
    const siteInfo = getSiteInfo(task.sourceUrl || task.url);

    const isPaused = task.status === 'paused';
    const isActive = task.status === 'downloading';
    const isCompleted = task.status === 'completed';
    const isError = task.status === 'error';
    const isPreparing = task.status === 'preparing';
    const isMerging = task.status === 'merging';
    const isCancelled = task.status === 'cancelled';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
                duration: 0.3,
                delay: Math.min(index * 0.05, 0.3), // Staggered entrance
                layout: { type: "spring", stiffness: 300, damping: 30 }
            }}
            className="group relative rounded-xl bg-white dark:bg-glass-surface backdrop-blur-md border border-gray-100 dark:border-glass-border p-4 transition-all hover:bg-gray-50 dark:hover:bg-[#252236] shadow-sm dark:shadow-none"
        >
            <div className="flex gap-4 items-center">
                {/* Thumbnail */}
                <div className="relative shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-slate-100 dark:bg-black/50 ring-1 ring-slate-200 dark:ring-white/5 flex items-center justify-center group/thumb shadow-inner">
                    {task.thumbnail ? (
                        <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover" />
                    ) : (
                        task.format === 'audio' ? <Music className="text-slate-400 dark:text-white/20" /> : <FileVideo className="text-slate-400 dark:text-white/20" />
                    )}

                    {/* Duration Badge */}
                    {task.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                            {formatDuration(task.duration)}
                        </div>
                    )}

                    {/* Site Logo Badge */}
                    {siteInfo.logoUrl && (
                        <div className="absolute top-1 left-1 bg-white rounded-full p-0.5 shadow-lg border border-slate-100 dark:border-white/10 group-hover:scale-110 transition-transform">
                            <img src={siteInfo.logoUrl} alt={siteInfo.name} className="size-3.5 object-contain" />
                        </div>
                    )}

                    {isActive || isPaused ? (
                        <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 cursor-pointer"
                            onClick={() => isPaused ? resumeTask(task.id) : pauseTask(task.id)}
                        >
                            {isActive ? (
                                <Pause className="text-white drop-shadow-lg fill-current" size={24} />
                            ) : (
                                <Play className="text-white drop-shadow-lg fill-current" size={24} />
                            )}
                        </div>
                    ) : isCompleted ? (
                        <div
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 cursor-pointer"
                            onClick={() => openFolder(task.id)}
                        >
                            <FolderOpen className="text-white drop-shadow-lg" size={24} />
                        </div>
                    ) : null}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-slate-900 dark:text-white font-medium truncate pr-4" title={task.title || task.url}>
                            {task.title || task.url}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isCompleted && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => openFolder(task.id)} title="Open Folder">
                                    <FolderOpen size={16} />
                                </Button>
                            )}
                            {isActive && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => pauseTask(task.id)} aria-label="Pause Download">
                                    <Pause size={16} />
                                </Button>
                            )}
                            {isPaused && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-400 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10" onClick={() => resumeTask(task.id)} aria-label="Resume Download">
                                    <Play size={16} />
                                </Button>
                            )}
                            {isError && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 dark:text-red-400 hover:bg-red-500/10" onClick={() => retryTask(task.id)} aria-label="Retry Download">
                                    <RotateCcw size={16} />
                                </Button>
                            )}
                            <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-slate-400 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => removeTask(task.id)}
                                aria-label="Remove Download"
                            >
                                <X size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-[#a19db9]">
                        <span className={cn(
                            "capitalize font-medium",
                            isPreparing && "text-blue-600 dark:text-blue-400",
                            isMerging && "text-purple-600 dark:text-purple-400 font-bold",
                            isCompleted && "text-green-600 dark:text-green-400",
                            isError && "text-red-600 dark:text-red-400 font-bold",
                            isCancelled && "text-slate-400 dark:text-gray-500"
                        )}>
                            {isPreparing ? "Preparing Engine..." : isMerging ? "Merging Media Files..." : task.status}
                        </span>

                        {/* Platform Badge */}
                        <AnimatePresence>
                            {task.status !== 'queued' && siteInfo.name !== 'Unknown' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10"
                                    style={{ borderColor: `${siteInfo.color}33` }}
                                >
                                    {siteInfo.logoUrl && (
                                        <img src={siteInfo.logoUrl} alt="" className="size-3 object-contain" />
                                    )}
                                    <span
                                        className="text-[10px] font-bold uppercase tracking-wider"
                                        style={{ color: siteInfo.color }}
                                    >
                                        {siteInfo.name}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {/* Video Size (Permanent) */}
                        {task.totalSize && task.totalSize !== '-' && (
                            <>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-[#3f3b54]" />
                                <span className="flex gap-1.5 items-center">
                                    <span className="opacity-50">Size:</span>
                                    <span className="text-slate-700 dark:text-white font-mono">{task.totalSize}</span>
                                </span>
                            </>
                        )}

                        {/* ETA & Speed (Transient - Only when active) */}
                        {isActive && task.eta && task.eta !== '-' && (
                            <>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-[#3f3b54]" />
                                <span className="flex gap-1.5 items-center text-primary font-medium">
                                    <span className="opacity-50 text-slate-500">ETA:</span>
                                    <span className="font-mono">{task.eta}</span>
                                </span>
                            </>
                        )}

                        {isActive && (
                            <>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-[#3f3b54]" />
                                <span className="flex gap-1.5 items-center font-medium">
                                    <span className="opacity-50">Speed:</span>
                                    <span className="text-slate-700 dark:text-white font-mono">{task.speed || '-'}</span>
                                </span>
                            </>
                        )}

                        {isError && (
                            <>
                                <span className="size-1 rounded-full bg-slate-300 dark:bg-[#3f3b54]" />
                                <span className="text-red-500 dark:text-red-400 font-medium truncate max-w-[150px]">{task.error}</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-3">
                        <div
                            className="h-1.5 w-full bg-slate-100 dark:bg-[#3f3b54] rounded-full overflow-hidden shadow-inner"
                            role="progressbar"
                            aria-valuenow={task.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${task.title} progress`}
                        >
                            <div
                                className={cn(
                                    "h-full rounded-full relative transition-all duration-300",
                                    isCompleted ? "bg-green-500" : "bg-gradient-to-r from-primary to-purple-500",
                                    isPaused && "opacity-50 grayscale",
                                    isError && "bg-red-500",
                                    isCancelled && "bg-gray-700",
                                    (isPreparing || isMerging) && "animate-pulse w-full bg-blue-500/50"
                                )}
                                style={{ width: (isPreparing || isMerging) ? '100%' : `${task.progress}%` }}
                            >
                                {isActive && (
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse" />
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-white tabular-nums w-8 text-right" aria-live="polite">
                            {task.progress.toFixed(1)}%
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}, (prev, next) => {
    return (
        prev.task.id === next.task.id &&
        prev.task.progress === next.task.progress &&
        prev.task.status === next.task.status &&
        prev.task.speed === next.task.speed &&
        prev.task.eta === next.task.eta &&
        prev.task.totalSize === next.task.totalSize
    );
});
