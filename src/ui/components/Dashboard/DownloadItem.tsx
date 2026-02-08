import { memo } from "react";
import { Play, Pause, X, FileVideo, Music, RotateCcw } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/ui/primitives/Button";
import { Download } from "@/types/download";
import { useDownloadStore } from "@/state/useDownloadStore";
import { motion } from "framer-motion";
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
    const { pauseTask, resumeTask, cancelTask, retryTask } = useDownloadStore();
    const siteInfo = getSiteInfo(task.sourceUrl || task.url);

    const isPaused = task.status === 'paused';
    const isActive = task.status === 'downloading';
    const isCompleted = task.status === 'completed';
    const isError = task.status === 'error';

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
            className="group relative rounded-xl bg-glass-surface backdrop-blur-md border border-glass-border p-4 transition-all hover:bg-[#252236]"
        >
            <div className="flex gap-4 items-center">
                {/* Thumbnail */}
                <div className="relative shrink-0 w-32 h-20 rounded-lg overflow-hidden bg-black/50 ring-1 ring-white/5 flex items-center justify-center group/thumb">
                    {task.thumbnail ? (
                        <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover" />
                    ) : (
                        task.format === 'audio' ? <Music className="text-white/20" /> : <FileVideo className="text-white/20" />
                    )}

                    {/* Duration Badge */}
                    {task.duration && (
                        <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                            {formatDuration(task.duration)}
                        </div>
                    )}

                    {/* Site Logo Badge */}
                    {siteInfo.logoUrl && (
                        <div className="absolute top-1 left-1 bg-white rounded-full p-0.5 shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
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
                    ) : null}
                </div>

                {/* Info & Controls */}
                <div className="flex-1 min-w-0 flex flex-col gap-1">
                    <div className="flex justify-between items-start">
                        <h4 className="text-white font-medium truncate pr-4" title={task.title || task.url}>
                            {task.title || task.url}
                        </h4>
                        <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            {isActive && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => pauseTask(task.id)} aria-label="Pause Download">
                                    <Pause size={16} />
                                </Button>
                            )}
                            {isPaused && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => resumeTask(task.id)} aria-label="Resume Download">
                                    <Play size={16} />
                                </Button>
                            )}
                            {isError && (
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-400 hover:bg-red-500/20" onClick={() => retryTask(task.id)} aria-label="Retry Download">
                                    <RotateCcw size={16} />
                                </Button>
                            )}
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/20" onClick={() => cancelTask(task.id)} aria-label="Cancel Download">
                                <X size={16} />
                            </Button>
                        </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-3 text-xs text-[#a19db9]">
                        <span className="capitalize">{task.status}</span>
                        {task.speed && (
                            <>
                                <span className="size-1 rounded-full bg-[#3f3b54]" />
                                <span className="text-white font-mono">{task.speed}</span>
                            </>
                        )}
                        {task.eta && (
                            <>
                                <span className="size-1 rounded-full bg-[#3f3b54]" />
                                <span>ETA: {task.eta}</span>
                            </>
                        )}
                        {task.totalSize && (
                            <>
                                <span className="size-1 rounded-full bg-[#3f3b54]" />
                                <span>{task.totalSize}</span>
                            </>
                        )}
                        {isError && (
                            <>
                                <span className="size-1 rounded-full bg-[#3f3b54]" />
                                <span className="text-red-400">{task.error}</span>
                            </>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2 flex items-center gap-3">
                        <div
                            className="h-1.5 w-full bg-[#3f3b54] rounded-full overflow-hidden"
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
                                    isError && "bg-red-500"
                                )}
                                style={{ width: `${task.progress}%` }}
                            >
                                {isActive && (
                                    <div className="absolute right-0 top-0 bottom-0 w-2 bg-white/50 animate-pulse" />
                                )}
                            </div>
                        </div>
                        <span className="text-xs font-medium text-white tabular-nums w-8 text-right" aria-live="polite">
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
        prev.task.eta === next.task.eta
    );
});
