import { DownloadCloud, Sparkles } from "lucide-react";

export const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-white/5 rounded-3xl bg-white/[0.02]">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative bg-surface-dark p-6 rounded-2xl border border-white/10 shadow-xl">
                    <DownloadCloud size={48} className="text-primary" />
                    <Sparkles size={24} className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">Ready to download?</h3>
            <p className="text-gray-400 max-w-xs text-sm">
                Paste a URL above to start downloading videos from your favorite platforms.
            </p>
        </div>
    );
};
