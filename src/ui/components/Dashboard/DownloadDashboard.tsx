import { useEffect, useState } from "react";
import { Pause, Trash2, ArrowDownUp, Link as LinkIcon } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { AddDownloadForm } from "./AddDownloadForm";
import { DownloadItem } from "./DownloadItem";
import { useDownloadStore } from "@/state/useDownloadStore";
import { FormatSelector } from "./FormatSelector";
import { EmptyState } from "./EmptyState";
import { DownloadItemSkeleton } from "./DownloadItemSkeleton";
import { useSmartClipboard } from "@/hooks/useSmartClipboard";
import { ClipboardToast } from "./ClipboardToast";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/utils/cn";


export const DownloadDashboard = () => {
    const { tasks, isLoading, initializeListeners, pauseTask, removeTask, analyzeUrl } = useDownloadStore();
    const analysisCtx = useDownloadStore(state => state.analysisCtx);
    const confirmDownload = useDownloadStore(state => state.confirmDownload);
    const cancelAnalysis = useDownloadStore(state => state.cancelAnalysis);
    const { detectedUrl, clearDetected } = useSmartClipboard();
    const [isDragging, setIsDragging] = useState(false);
    const [isConfirmingClear, setIsConfirmingClear] = useState(false);

    useEffect(() => {
        initializeListeners();
    }, [initializeListeners]);

    const activeCount = tasks.filter(t => t.status === 'downloading' || t.status === 'queued').length;
    const completedCount = tasks.filter(t => t.status === 'completed' || t.status === 'error').length;

    const handlePauseAll = () => {
        tasks.filter(t => t.status === 'downloading').forEach(t => pauseTask(t.id));
    };

    const handleClearCompleted = () => {
        if (!isConfirmingClear && completedCount > 0) {
            setIsConfirmingClear(true);
            setTimeout(() => setIsConfirmingClear(false), 3000); // Reset after 3 seconds
            return;
        }
        tasks.filter(t => t.status === 'completed' || t.status === 'error').forEach(t => removeTask(t.id));
        setIsConfirmingClear(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const text = e.dataTransfer.getData("text/plain");
        const url = e.dataTransfer.getData("text/uri-list") || text;

        if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
            await analyzeUrl(url);
        }
    };

    return (
        <div
            className="flex flex-col gap-8 min-h-full pb-10"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <AnimatePresence>
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-primary/20 backdrop-blur-sm border-2 border-dashed border-primary m-4 rounded-3xl flex flex-col items-center justify-center pointer-events-none"
                    >
                        <div className="p-6 bg-white dark:bg-surface-dark rounded-full shadow-2xl border border-gray-200 dark:border-glass-border animate-bounce">
                            <LinkIcon size={48} className="text-primary" />
                        </div>
                        <h3 className="text-slate-900 dark:text-white text-2xl font-bold mt-6">Drop to Download</h3>
                        <p className="text-slate-500 dark:text-gray-400">Release to start analysis</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {detectedUrl && (
                    <ClipboardToast url={detectedUrl} onClear={clearDetected} />
                )}
            </AnimatePresence>

            {/* Analysis Modal */}
            {analysisCtx && (
                <FormatSelector
                    metadata={analysisCtx.metadata}
                    onConfirm={confirmDownload}
                    onCancel={cancelAnalysis}
                />
            )}

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap justify-between items-end gap-4"
            >
                <div className="flex flex-col gap-1">
                    <h2 className="text-slate-900 dark:text-white text-4xl font-black tracking-tight">Dashboard</h2>
                    <p className="text-slate-500 dark:text-[#a19db9] text-base font-normal">Manage your active video downloads and queue.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-white dark:bg-surface-dark border-gray-200 dark:border-glass-border hover:bg-gray-100 dark:hover:bg-white/5 text-slate-700 dark:text-white gap-2 transition-all" onClick={handlePauseAll}>
                        <Pause size={20} />
                        Pause All
                    </Button>
                    <Button
                        variant={isConfirmingClear ? "destructive" : "outline"}
                        className={cn(
                            "gap-2 transition-all",
                            !isConfirmingClear && "bg-white dark:bg-surface-dark border-gray-200 dark:border-glass-border hover:bg-gray-100 dark:hover:bg-white/5 text-slate-700 dark:text-white"
                        )}
                        onClick={handleClearCompleted}
                        disabled={completedCount === 0}
                    >
                        {isConfirmingClear ? <Trash2 size={20} /> : <Trash2 size={20} />}
                        {isConfirmingClear ? "Are you sure?" : "Clear Completed"}
                    </Button>
                </div>
            </motion.div>

            {/* URL Input */}
            <AddDownloadForm />

            {/* Active Downloads Selection */}
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-slate-900 dark:text-white text-lg font-bold flex items-center gap-2">
                        Active Queue
                        <span className="bg-primary/20 text-primary text-xs font-bold px-2 py-0.5 rounded-full">{activeCount}</span>
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-[#a19db9]">
                        <span>Sort by:</span>
                        <div className="flex items-center gap-1 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors">
                            <span className="font-medium text-slate-700 dark:text-white">Date Added</span>
                            <ArrowDownUp size={14} />
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex flex-col gap-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {isLoading || useDownloadStore.getState().isAnalyzing ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col gap-4"
                            >
                                <DownloadItemSkeleton />
                                {tasks.map((task, index) => (
                                    <DownloadItem key={task.id} task={task} index={index} />
                                ))}
                            </motion.div>
                        ) : tasks.length === 0 ? (
                            <motion.div
                                key="empty"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                            >
                                <EmptyState />
                            </motion.div>
                        ) : (
                            tasks.map((task, index) => (
                                <DownloadItem key={task.id} task={task} index={index} />
                            ))
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
