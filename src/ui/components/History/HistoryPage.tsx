import { useDownloadStore } from "@/state/useDownloadStore";
import { ArrowLeft, Clock, FileVideo, FolderOpen, Music, Search, Trash2, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";
import { cn } from "@/utils/cn";
import { Button } from "@/ui/primitives/Button";
import { motion, AnimatePresence } from "framer-motion";
import { getSiteInfo } from "@/utils/siteUtils";

export const HistoryPage = () => {
    const tasks = useDownloadStore(state => state.tasks);
    const cancelTask = useDownloadStore(state => state.cancelTask);
    const openFolder = useDownloadStore(state => state.openFolder);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Filter for completed items + search
    const historyItems = useMemo(() => tasks.filter(t =>
        (t.status === 'completed' || t.status === 'error') &&
        (t.title?.toLowerCase().includes(searchTerm.toLowerCase()) || t.url.includes(searchTerm.toLowerCase()))
    ), [tasks, searchTerm]);

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === historyItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(historyItems.map(t => t.id)));
        }
    };

    const handleBulkDelete = () => {
        selectedIds.forEach(id => cancelTask(id));
        setSelectedIds(new Set());
    };

    const handleBulkOpen = () => {
        selectedIds.forEach(id => openFolder(id));
    };

    const handleClearHistory = () => {
        historyItems.forEach(t => cancelTask(t.id));
        setSelectedIds(new Set());
    };

    return (
        <div className="flex flex-col gap-6 h-full pb-8">
            {/* Header */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/" className="p-2 hover:bg-white/5 rounded-xl transition-colors text-gray-400 hover:text-white">
                            <ArrowLeft size={20} />
                        </Link>
                        <div className="flex flex-col">
                            <h2 className="text-white text-3xl font-bold tracking-tight">Download History</h2>
                            <p className="text-[#a19db9] text-sm">View and manage your past downloads</p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search history..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="bg-surface-dark border border-glass-border rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-primary/50 transition-all w-64"
                            />
                        </div>
                        {historyItems.length > 0 && selectedIds.size === 0 && (
                            <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10 gap-2" onClick={handleClearHistory}>
                                <Trash2 size={16} />
                                Clear All
                            </Button>
                        )}
                    </div>
                </div>

                {/* Bulk Actions Toolbar */}
                <AnimatePresence>
                    {selectedIds.size > 0 && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center justify-between p-3 px-4 rounded-xl bg-primary/10 border border-primary/20">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={toggleSelectAll}
                                        className="size-5 rounded border border-primary/40 flex items-center justify-center bg-primary/20 text-white"
                                    >
                                        {selectedIds.size === historyItems.length && <CheckCircle2 size={14} className="fill-primary text-black" />}
                                    </button>
                                    <span className="text-primary text-sm font-bold">{selectedIds.size} items selected</span>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10 gap-2" onClick={handleBulkOpen}>
                                        <FolderOpen size={16} />
                                        Open Folders
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10 gap-2" onClick={handleBulkDelete}>
                                        <Trash2 size={16} />
                                        Delete Selected
                                    </Button>
                                    <Button size="sm" variant="ghost" className="text-gray-400" onClick={() => setSelectedIds(new Set())}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pr-2">
                {historyItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-gray-500 gap-4">
                        <div className="size-16 rounded-full bg-white/5 flex items-center justify-center">
                            <Clock size={32} className="opacity-50" />
                        </div>
                        <p>No history found</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {historyItems.map((task, index) => {
                            const isSelected = selectedIds.has(task.id);
                            const siteInfo = getSiteInfo(task.sourceUrl || task.url);
                            return (
                                <motion.div
                                    key={task.id}
                                    layout
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                    className={cn(
                                        "group flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                                        isSelected ? "bg-primary/5 border-primary/30" : "bg-glass-surface border-glass-border hover:bg-white/5"
                                    )}
                                    onClick={() => toggleSelect(task.id)}
                                >
                                    <div className="flex items-center gap-4 overflow-hidden">
                                        <div className={cn(
                                            "size-5 rounded border transition-all shrink-0 flex items-center justify-center",
                                            isSelected ? "bg-primary border-primary text-black" : "border-gray-600 group-hover:border-primary/50"
                                        )}>
                                            {isSelected && <CheckCircle2 size={14} className="fill-current" />}
                                        </div>

                                        <div className="relative">
                                            <div className={cn(
                                                "size-10 rounded-lg flex items-center justify-center shrink-0",
                                                task.format === 'audio' ? "bg-purple-500/20 text-purple-400" : "bg-blue-500/20 text-blue-400"
                                            )}>
                                                {task.format === 'audio' ? <Music size={20} /> : <FileVideo size={20} />}
                                            </div>
                                            {siteInfo.logoUrl && (
                                                <div className="absolute -bottom-1 -right-1 size-4 bg-white rounded-full p-0.5 shadow-sm border border-glass-border">
                                                    <img src={siteInfo.logoUrl} alt={siteInfo.name} className="w-full h-full object-contain" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-white font-medium truncate w-full" title={task.title}>{task.title || task.url}</span>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className={cn(task.status === 'error' ? "text-red-400" : "text-green-400 capitalize")}>{task.status}</span>

                                                {/* History Platform Badge */}
                                                {siteInfo.name !== 'Unknown' && (
                                                    <div
                                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[9px] font-bold uppercase tracking-tight"
                                                        style={{ color: siteInfo.color, borderColor: `${siteInfo.color}22` }}
                                                    >
                                                        {siteInfo.name}
                                                    </div>
                                                )}

                                                <span>•</span>
                                                <span>{task.format.toUpperCase()}</span>
                                                {task.formatSpec && (
                                                    <>
                                                        <span>•</span>
                                                        <span>{task.formatSpec}</span>
                                                    </>
                                                )}
                                                {task.totalSize && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="font-mono">{task.totalSize}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-white" title="Open Folder" onClick={() => openFolder(task.id)}>
                                            <FolderOpen size={18} />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="text-gray-400 hover:text-red-400" onClick={() => cancelTask(task.id)} title="Remove from History">
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
