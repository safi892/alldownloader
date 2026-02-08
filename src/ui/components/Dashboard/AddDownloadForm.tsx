import { useState, useEffect } from "react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { ArrowRight, Link, ListPlus, CheckCircle, FolderOpen } from "lucide-react";
import { useDownloadStore } from "@/state/useDownloadStore";
import { open } from "@tauri-apps/plugin-dialog";

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

            <div className="relative flex flex-col p-6 rounded-2xl bg-[#1e1b2e]/80 backdrop-blur-xl border border-glass-border shadow-2xl gap-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-bold text-lg">New Download</h3>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-auto py-1.5 px-3 text-white border-glass-border bg-white/5 hover:bg-white/10 gap-2"
                            onClick={handleChooseFolder}
                        >
                            <FolderOpen size={16} className="text-primary" />
                            <span className="max-w-[150px] truncate text-xs">
                                {downloadPath ? downloadPath.split(/[/\\]/).pop() : "Choose Folder"}
                            </span>
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-auto py-1 px-2 text-primary hover:text-purple-400 font-medium">
                            <ListPlus size={16} className="mr-1.5" />
                            Batch Mode
                        </Button>
                    </div>
                </div>

                <div className="flex w-full items-center gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Link className="text-[#a19db9]" size={20} />
                        </div>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="pl-12 py-6 text-base rounded-xl bg-[#131022] border-glass-border focus-visible:ring-primary"
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

                <div className="flex gap-4 text-xs text-[#a19db9]">
                    {["Supported: YouTube", "Vimeo", "TikTok", "Twitter/X"].map((platform) => (
                        <span key={platform} className="flex items-center gap-1">
                            <CheckCircle size={14} className="text-green-400" />
                            {platform}
                        </span>
                    ))}
                </div>
            </div>
        </form>
    );
};
