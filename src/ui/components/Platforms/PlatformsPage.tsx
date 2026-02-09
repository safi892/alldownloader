import { useState } from "react";
import { Input } from "@/ui/primitives/Input";
import {
    Search,
    Youtube,
    Instagram,
    Twitter,
    Facebook,
    Music2,
    Share2,
    Video,
    Github,
    Twitch,
    Globe
} from "lucide-react";
import { cn } from "@/utils/cn";

interface Platform {
    name: string;
    icon: any;
    color: string;
    description: string;
    isNew?: boolean;
}

const PLATFORMS: Platform[] = [
    { name: "YouTube", icon: Youtube, color: "#FF0000", description: "Videos, Shorts, Music" },
    { name: "Instagram", icon: Instagram, color: "#E4405F", description: "Reels, Stories, Posts" },
    { name: "TikTok", icon: Music2, color: "#000000", description: "Viral vertical videos" },
    { name: "Douyin", icon: Music2, color: "#000000", description: "Chinese version of TikTok", isNew: true },
    { name: "X / Twitter", icon: Twitter, color: "#1DA1F2", description: "Video tweets and media" },
    { name: "Facebook", icon: Facebook, color: "#1877F2", description: "Videos, Reels, Live" },
    { name: "Vimeo", icon: Video, color: "#1AB7EA", description: "High-quality video content" },
    { name: "Twitch", icon: Twitch, color: "#9146FF", description: "Live streams and clips" },
    { name: "GitHub", icon: Github, color: "#181717", description: "Repository media and assets" },
    { name: "Reddit", icon: Share2, color: "#FF4500", description: "Subreddit videos and gifs" },
    { name: "SoundCloud", icon: Music2, color: "#FF3300", description: "Tracks and music albums" },
    { name: "LinkedIn", icon: Share2, color: "#0A66C2", description: "Professional video content", isNew: true },
    { name: "Pinterest", icon: Video, color: "#BD081C", description: "Idea pins and videos", isNew: true },
    { name: "Bilibili", icon: PlayIcon, color: "#00A1D6", description: "Anime and creative videos", isNew: true },
    { name: "DailyMotion", icon: PlayIcon, color: "#0066DC", description: "News and trending videos" },
    { name: "Steam", icon: Video, color: "#171a21", description: "Game trailers and broadcasts", isNew: true },
    { name: "Odysee", icon: Video, color: "#EF1970", description: "LBRY-based video platform", isNew: true },
    { name: "BitChute", icon: Video, color: "#C10000", description: "Peer-to-peer video hosting", isNew: true },
    { name: "Rumble", icon: Video, color: "#85B739", description: "Independent video hosting", isNew: true },
    { name: "VK", icon: Video, color: "#0077FF", description: "European social media videos", isNew: true },
    { name: "Weibo", icon: Video, color: "#E6162D", description: "Chinese microblogging media", isNew: true },
    { name: "YOUKU", icon: Video, color: "#00A6E3", description: "Premier Chinese video hosting", isNew: true },
    { name: "Apple Podcasts", icon: Music2, color: "#9146FF", description: "Audio episodes and shows", isNew: true },
    { name: "Bandcamp", icon: Music2, color: "#629aa9", description: "Independent music and artist support", isNew: true },
    { name: "Mixcloud", icon: Music2, color: "#52AAD8", description: "DJ sets, radio and podcasts", isNew: true },
    { name: "ESPN", icon: Video, color: "#CC0000", description: "Sports clips and highlights", isNew: true },
    { name: "BBC", icon: Video, color: "#000000", description: "Global news and documentaries", isNew: true },
    { name: "TED", icon: Video, color: "#E62B1E", description: "Talks and educational presentations", isNew: true },
    { name: "Coub", icon: Video, color: "#222222", description: "Short looping videos" },
];

function PlayIcon({ className, size }: { className?: string, size?: number }) {
    return <Video className={className} size={size} />;
}

export const PlatformsPage = () => {
    const [search, setSearch] = useState("");

    const filteredPlatforms = PLATFORMS.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="flex flex-col gap-8 max-w-5xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                        Supported Platforms
                    </h2>
                    <p className="text-slate-500 dark:text-gray-400 mt-2">Discover thousands of sites supported by VidFlow's engine.</p>
                </div>

                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-400" size={18} />
                    <Input
                        placeholder="Search platforms..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-glass-border focus:ring-primary h-11 rounded-xl text-slate-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPlatforms.map((platform) => (
                    <div
                        key={platform.name}
                        className="p-5 rounded-2xl bg-white dark:bg-[#1e1b2e]/60 border border-gray-100 dark:border-glass-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:bg-[#1e1b2e]/80 transition-all group flex flex-col gap-4 cursor-pointer relative"
                    >
                        {platform.isNew && (
                            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase tracking-tighter animate-pulse">
                                New
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div
                                className="size-12 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110"
                                style={{ backgroundColor: `${platform.color}15` }}
                            >
                                <platform.icon size={24} style={{ color: platform.color }} />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-slate-900 dark:text-white">{platform.name}</span>
                                <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Universal Support</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {platform.description}
                        </p>
                    </div>
                ))}

                {filteredPlatforms.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 gap-4">
                        <Globe size={48} className="opacity-20" />
                        <span className="text-sm">No platforms matching "{search}"</span>
                    </div>
                )}
            </div>

            <div className="p-8 rounded-3xl bg-gradient-to-br from-primary/5 to-purple-600/5 dark:from-primary/10 dark:to-purple-600/10 border border-primary/20 backdrop-blur-sm flex flex-col md:flex-row items-center gap-8 mt-4 shadow-sm">
                <div className="flex-1 flex flex-col gap-2">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Don't see your site?</h3>
                    <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed">
                        VidFlow uses the powerful engine that supports over <span className="text-primary font-bold">1,000+ websites</span>.
                        Simply paste any URL in the dashboard and we'll analyze it automatically.
                    </p>
                </div>
                <Button
                    variant="primary"
                    className="px-8 whitespace-nowrap h-12 shadow-xl shadow-primary/20"
                    onClick={() => {
                        window.open("https://github.com/yt-dlp/yt-dlp/blob/master/supportedsites.md", "_blank");
                    }}
                >
                    View All 1000+ Sites
                </Button>
            </div>
        </div>
    );
};

// Internal components to avoid import issues
function Button({ children, variant, className, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-xl font-bold transition-all h-fit",
                variant === "primary" ? "bg-primary text-white shadow-lg shadow-primary/25 hover:scale-105" : "bg-gray-100 dark:bg-white/5 text-slate-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10",
                className
            )}
        >
            {children}
        </button>
    );
}
