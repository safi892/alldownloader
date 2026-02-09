import { Search, Plus, Radio } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import { useState } from "react";

export const ChannelsPage = () => {
    const [search, setSearch] = useState("");

    return (
        <div className="flex flex-col gap-8 text-white max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Creator Channels
                    </h2>
                    <p className="text-gray-400 mt-2">Track and auto-download from your favorite creators.</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                        <Input
                            placeholder="Search channels..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 bg-white/5 border-glass-border focus:ring-primary h-11 rounded-xl"
                        />
                    </div>
                    <Button className="h-11 px-6 shadow-lg shadow-primary/20 gap-2">
                        <Plus size={18} />
                        Add Channel
                    </Button>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5">
                <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Radio size={40} className="text-primary animate-pulse" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white">Coming Soon: Channel Monitoring</h3>
                <p className="text-slate-500 dark:text-gray-400 text-center max-w-md">
                    We're building a powerful monitoring system that will automatically detect and download new uploads from your favorite YouTube channels, Twitch streamers, and Instagram creators.
                </p>
                <div className="flex gap-4 mt-8">
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs shadow-sm">
                        <div className="size-2 rounded-full bg-red-500" />
                        Live Detection
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs shadow-sm">
                        <div className="size-2 rounded-full bg-blue-500" />
                        Auto-Download
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 text-xs shadow-sm">
                        <div className="size-2 rounded-full bg-green-500" />
                        Smart Sorting
                    </div>
                </div>
            </div>
        </div>
    );
};
