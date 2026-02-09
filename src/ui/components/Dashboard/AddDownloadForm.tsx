import { useState, useEffect } from "react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { ArrowRight, Link, ListPlus, FolderOpen } from "lucide-react";
import { useDownloadStore } from "@/state/useDownloadStore";
import { open } from "@tauri-apps/plugin-dialog";
import { readText } from "@tauri-apps/plugin-clipboard-manager";

export const AddDownloadForm = () => {
    const [url, setUrl] = useState("");
    const isAnalyzing = useDownloadStore(state => state.isAnalyzing);
    const analyzeUrl = useDownloadStore(state => state.analyzeUrl);
    const downloadPath = useDownloadStore(state => state.downloadPath);
    const setDownloadPath = useDownloadStore(state => state.setDownloadPath);
    const prefillUrl = useDownloadStore(state => state.prefillUrl);
    const setPrefillUrl = useDownloadStore(state => state.setPrefillUrl);

    useEffect(() => {
        if (prefillUrl) {
            setUrl(prefillUrl);
            setPrefillUrl(null); // Consume it
        }
    }, [prefillUrl, setPrefillUrl]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (url) {
            analyzeUrl(url);
            setUrl(""); // Clear input after analyze
        }
    };

    const tryAutoPaste = async () => {
        // Auto-paste from clipboard if input is empty
        if (!url) {
            try {
                const clipboardText = await readText();
                if (clipboardText && (clipboardText.startsWith("http://") || clipboardText.startsWith("https://") || clipboardText.includes("www."))) {
                    setUrl(clipboardText.trim());
                }
            } catch (error) {
                // Silently fail if clipboard access is denied
                console.log("Clipboard access not available:", error);
            }
        }
    };

    const handleChooseFolder = async () => {
        const selected = await open({
            directory: true,
            multiple: false,
        });
        if (selected && typeof selected === "string") {
            setDownloadPath(selected);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full relative group">
            {/* Glow Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-purple-600 rounded-2xl opacity-30 blur group-hover:opacity-50 transition duration-500" />

            <div className="relative flex flex-col p-6 rounded-2xl bg-white dark:bg-[#1e1b2e]/80 backdrop-blur-xl border border-gray-100 dark:border-glass-border shadow-2xl gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-slate-900 dark:text-white font-bold text-lg">New Download</h3>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-auto py-1.5 px-3 text-slate-700 dark:text-white border-gray-200 dark:border-glass-border bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 gap-2 font-medium"
                            onClick={handleChooseFolder}
                        >
                            <FolderOpen size={16} className="text-primary" />
                            <span className="max-w-[150px] truncate text-xs">
                                {downloadPath ? downloadPath.split(/[/\\]/).pop() : "Choose Folder"}
                            </span>
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-auto py-1 px-2 text-primary hover:text-primary/80 dark:hover:text-purple-400 font-bold">
                            <ListPlus size={16} className="mr-1.5" />
                            Batch Mode
                        </Button>
                    </div>
                </div>

                <div className="flex w-full items-center gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                            <Link className="text-slate-400 dark:text-[#a19db9]" size={20} />
                        </div>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onFocus={tryAutoPaste}
                            onClick={tryAutoPaste}
                            className="pl-12 py-6 text-base rounded-xl bg-gray-100 dark:bg-[#131022] border-gray-200 dark:border-glass-border focus-visible:ring-primary text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-500"
                            placeholder="Paste video URL from YouTube, TikTok, Vimeo..."
                        />
                    </div>
                    <Button
                        type="submit"
                        size="lg"
                        className="h-[52px] rounded-xl px-8 shadow-lg shadow-primary/30 font-bold gap-2"
                        disabled={isAnalyzing}
                    >
                        {isAnalyzing ? "Analyzing..." : "Analyze"}
                        {!isAnalyzing && <ArrowRight size={20} />}
                    </Button>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="h-px bg-slate-100 dark:bg-white/5 w-full" />
                    <p className="text-[11px] text-slate-500 dark:text-[#a19db9] font-medium leading-relaxed">
                        VidFlow uses the powerful engine that supports over <span className="text-primary font-extrabold uppercase tracking-tight">1,000+ websites</span>.
                        Simply paste any URL in the dashboard and we'll analyze it automatically.
                    </p>
                </div>
            </div>
        </form>
    );
};
