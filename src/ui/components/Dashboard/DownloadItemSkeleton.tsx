
export const DownloadItemSkeleton = () => {
    return (
        <div className="w-full h-[112px] rounded-xl bg-slate-50/50 dark:bg-glass-surface border border-slate-100 dark:border-glass-border p-4 flex gap-4 items-center animate-pulse shadow-sm min-h-[112px]">
            {/* Thumbnail Skeleton */}
            <div className="shrink-0 w-32 h-20 rounded-lg bg-slate-200/60 dark:bg-white/5" />

            {/* Content Skeleton */}
            <div className="flex-1 flex flex-col gap-3">
                {/* Title */}
                <div className="h-5 w-3/4 bg-slate-200/60 dark:bg-white/5 rounded" />

                {/* Meta */}
                <div className="flex gap-3">
                    <div className="h-3 w-16 bg-slate-200/60 dark:bg-white/5 rounded" />
                    <div className="h-3 w-12 bg-slate-200/60 dark:bg-white/5 rounded" />
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 mt-1">
                    <div className="h-1.5 flex-1 bg-slate-200/60 dark:bg-white/5 rounded-full" />
                    <div className="h-3 w-8 bg-slate-200/60 dark:bg-white/5 rounded" />
                </div>
            </div>
        </div>
    );
};
