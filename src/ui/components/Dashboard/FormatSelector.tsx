import { VideoFormat, VideoMetadata } from "@/types/download";
import { Button } from "@/ui/primitives/Button";
import { X, Check, Film, Music, List as ListIcon, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/utils/cn";
import { Input } from "@/ui/primitives/Input";
import { getSiteInfo } from "@/utils/siteUtils";

interface FormatSelectorProps {
    metadata: VideoMetadata;
    onConfirm: (formatSpec: string) => void;
    onCancel: () => void;
}

export const FormatSelector = ({ metadata, onConfirm, onCancel }: FormatSelectorProps) => {
    const [tab, setTab] = useState<'video' | 'audio' | 'playlist'>(metadata.is_playlist ? 'playlist' : 'video');
    const siteInfo = getSiteInfo(metadata.webpage_url);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [audioQuality, setAudioQuality] = useState<'best' | '128' | '320'>('best');
    const [meta, setMeta] = useState({ artist: "", album: "" });

    // Grouping Logic for Video
    const videoOptions = useMemo(() => {
        const uniqueResolutions = new Map<string, VideoFormat>();
        metadata.formats.forEach(f => {
            if (f.vcodec && f.vcodec !== "none" && f.height) {
                let label = f.height >= 4320 ? "8K" : f.height >= 2160 ? "4K" : f.height >= 1440 ? "2K" : f.height >= 1080 ? "1080p" : f.height >= 720 ? "720p" : f.height >= 480 ? "480p" : `${f.height}p`;
                if (!uniqueResolutions.has(label) || (uniqueResolutions.get(label)!.ext !== 'mp4' && f.ext === 'mp4')) {
                    uniqueResolutions.set(label, f);
                }
            }
        });
        return Array.from(uniqueResolutions.entries()).sort((a, b) => (b[1].height || 0) - (a[1].height || 0));
    }, [metadata]);

    const handleConfirm = () => {
        if (tab === 'video' && selectedId) onConfirm(selectedId);
        else if (tab === 'audio') {
            // We can encode metadata in the formatSpec or handle it in a separate action
            // For now, let's just pass "audio" and we might need an advanced command later
            onConfirm("audio");
        }
        else if (tab === 'playlist') onConfirm("best"); // For playlist, download all best
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white dark:bg-[#1e1b2e] border border-gray-100 dark:border-glass-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-4 border-b border-gray-100 dark:border-glass-border flex items-start justify-between bg-gray-50 dark:bg-white/5">
                    <div className="flex gap-3">
                        <div className="relative shrink-0">
                            <img src={metadata.thumbnail} className="w-16 h-12 object-cover rounded-md bg-slate-100 dark:bg-black" alt="" />
                            {siteInfo.logoUrl && (
                                <div className="absolute -bottom-1 -right-1 size-5 bg-white rounded-full p-0.5 shadow-lg border border-slate-100 dark:border-white/10">
                                    <img src={siteInfo.logoUrl} alt={siteInfo.name} className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-slate-900 dark:text-white font-bold text-sm line-clamp-2 leading-tight">{metadata.title}</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[10px] text-slate-500 dark:text-gray-400">Source:</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-white/70 bg-slate-200 dark:bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider">{siteInfo.name}</span>
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white" onClick={onCancel}>
                        <X size={18} />
                    </Button>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 mx-4 mt-4 rounded-xl border border-gray-200 dark:border-transparent">
                    {!metadata.is_playlist && (
                        <>
                            <button
                                onClick={() => setTab('video')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all", tab === 'video' ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm dark:shadow-lg" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white")}
                            >
                                <Film size={14} /> Video
                            </button>
                            <button
                                onClick={() => setTab('audio')}
                                className={cn("flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all", tab === 'audio' ? "bg-white dark:bg-primary text-primary dark:text-white shadow-sm dark:shadow-lg" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white")}
                            >
                                <Music size={14} /> Audio
                            </button>
                        </>
                    )}
                    {metadata.is_playlist && (
                        <button
                            className="flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg bg-primary text-white"
                        >
                            <ListIcon size={14} /> Playlist ({metadata.entries?.length})
                        </button>
                    )}
                </div>

                {/* Content */}
                <div className="p-4 flex flex-col gap-3 min-h-[300px] max-h-[60vh] overflow-y-auto">
                    {tab === 'video' && videoOptions.map(([label, fmt]) => (
                        <div
                            key={fmt.format_id}
                            className={cn(
                                "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                                selectedId === fmt.format_id ? "bg-primary/5 dark:bg-primary/20 border-primary text-primary dark:text-white" : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-glass-border text-slate-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10"
                            )}
                            onClick={() => setSelectedId(fmt.format_id)}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn("size-4 rounded-full border flex items-center justify-center", selectedId === fmt.format_id ? "border-primary bg-primary" : "border-slate-300 dark:border-gray-500")}>
                                    {selectedId === fmt.format_id && <Check size={10} className="text-white" />}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{label} <span className="opacity-50 font-normal ml-1">({fmt.ext})</span></span>
                                    <span className="text-[10px] opacity-70 font-medium">{fmt.filesize ? `${(fmt.filesize / 1024 / 1024).toFixed(1)} MB` : 'Size unknown'}</span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {tab === 'audio' && (
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] text-primary dark:text-primary uppercase font-black px-1">Bitrate</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['best', '128', '320'].map(q => (
                                        <button
                                            key={q}
                                            onClick={() => setAudioQuality(q as any)}
                                            className={cn("py-2 rounded-lg border text-xs font-bold transition-all", audioQuality === q ? "bg-primary/5 dark:bg-primary/20 border-primary text-primary dark:text-white" : "bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-glass-border text-slate-500 dark:text-gray-400")}
                                        >
                                            {q === 'best' ? 'Auto' : `${q}kbps`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] text-primary dark:text-primary uppercase font-black px-1">Metadata (Optional)</label>
                                <Input
                                    placeholder="Artist Name"
                                    value={meta.artist}
                                    onChange={e => setMeta({ ...meta, artist: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-glass-border h-10 text-xs text-slate-900 dark:text-white"
                                />
                                <Input
                                    placeholder="Album Title"
                                    value={meta.album}
                                    onChange={e => setMeta({ ...meta, album: e.target.value })}
                                    className="bg-gray-50 dark:bg-white/5 border-gray-100 dark:border-glass-border h-10 text-xs text-slate-900 dark:text-white"
                                />
                            </div>

                            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 p-3 rounded-xl flex gap-3 shadow-sm">
                                <Info size={16} className="text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-blue-700 dark:text-blue-200/70 leading-relaxed font-medium">
                                    Embedding metadata and album art requires FFmpeg. We will use best available settings.
                                </p>
                            </div>
                        </div>
                    )}

                    {tab === 'playlist' && (
                        <div className="flex flex-col gap-2">
                            <p className="text-[10px] text-slate-500 dark:text-gray-400 uppercase font-black px-1">Videos in this playlist</p>
                            <div className="flex flex-col gap-1 border border-gray-100 dark:border-glass-border rounded-xl bg-gray-50 dark:bg-white/5 overflow-hidden">
                                {metadata.entries?.slice(0, 50).map((entry, i) => (
                                    <div key={entry.id} className="flex items-center gap-3 p-2 hover:bg-white/40 dark:hover:bg-white/5 border-b border-gray-100 dark:border-white/5 last:border-0 shadow-sm">
                                        <span className="text-[10px] text-slate-400 dark:text-gray-500 w-4 font-mono">{(i + 1).toString().padStart(2, '0')}</span>
                                        <span className="text-xs text-slate-700 dark:text-gray-300 truncate flex-1 font-medium">{entry.title}</span>
                                    </div>
                                ))}
                                {metadata.entries && metadata.entries.length > 50 && (
                                    <div className="p-2 text-center text-[10px] text-slate-400 dark:text-gray-500 bg-gray-100 dark:bg-black/20 italic">
                                        + {metadata.entries.length - 50} more items
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 dark:border-glass-border bg-gray-50 dark:bg-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-gray-500 italic max-w-[150px] truncate font-medium">
                        {tab === 'playlist' ? 'Whole playlist will be downloaded.' : ''}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={onCancel} className="text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white font-bold h-10 px-6">Cancel</Button>
                        <Button
                            disabled={tab === 'video' && !selectedId}
                            onClick={handleConfirm}
                            className="bg-primary hover:bg-primary/90 text-white h-10 px-8 font-bold shadow-lg shadow-primary/20"
                        >
                            Start {tab === 'playlist' ? 'Batch' : 'Download'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

