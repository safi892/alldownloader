import { DownloadCloud, Sparkles } from "lucide-react";

export const EmptyState = () => {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center border-2 border-dashed border-gray-100 dark:border-white/5 rounded-3xl bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="relative mb-6">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                <div className="relative bg-white dark:bg-surface-dark p-6 rounded-2xl border border-gray-100 dark:border-white/10 shadow-xl">
                    <DownloadCloud size={48} className="text-primary" />
                    <Sparkles size={24} className="absolute -top-2 -right-2 text-yellow-500 dark:text-yellow-400 animate-pulse" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to download?</h3>
            <p className="text-slate-500 dark:text-gray-400 max-w-sm text-sm font-medium leading-relaxed">
                VidFlow uses the powerful engine that supports over <span className="text-primary font-bold">1,000+ websites</span>.
                Simply paste any URL in the dashboard and we'll analyze it automatically.
            </p>
        </div>
    );
};
