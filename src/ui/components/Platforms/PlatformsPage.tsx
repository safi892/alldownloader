import { useState, useMemo } from "react";
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
    Globe,
    Tv,
    Gamepad2,
    Clapperboard,
    Mic,
    Play
} from "lucide-react";
import { cn } from "@/utils/cn";

type Category = "All" | "Social" | "Music" | "Anime" | "Entertainment";

interface Platform {
    name: string;
    icon: any;
    color: string;
    description: string;
    category: Category;
    isNew?: boolean;
}

const CATEGORIES: Category[] = ["All", "Social", "Music", "Anime", "Entertainment"];

const PLATFORMS: Platform[] = [
    // Social
    { name: "YouTube", icon: Youtube, color: "#FF0000", description: "Videos, Shorts, Music", category: "Entertainment" },
    { name: "Instagram", icon: Instagram, color: "#E4405F", description: "Reels, Stories, Posts", category: "Social" },
    { name: "TikTok", icon: Music2, color: "#000000", description: "Viral vertical videos", category: "Social" },
    { name: "Twitter / X", icon: Twitter, color: "#1DA1F2", description: "Video tweets and media", category: "Social" },
    { name: "Facebook", icon: Facebook, color: "#1877F2", description: "Videos, Reels, Live", category: "Social" },
    { name: "Reddit", icon: Share2, color: "#FF4500", description: "Subreddit videos and gifs", category: "Social" },
    { name: "LinkedIn", icon: Share2, color: "#0A66C2", description: "Professional video content", category: "Social", isNew: true },
    { name: "VK", icon: Video, color: "#0077FF", description: "European social media videos", category: "Social", isNew: true },
    { name: "Weibo", icon: Video, color: "#E6162D", description: "Chinese microblogging media", category: "Social", isNew: true },

    // Music
    { name: "SoundCloud", icon: Music2, color: "#FF3300", description: "Tracks and music albums", category: "Music" },
    { name: "Bandcamp", icon: Music2, color: "#629aa9", description: "Independent music and artist support", category: "Music", isNew: true },
    { name: "Mixcloud", icon: Music2, color: "#52AAD8", description: "DJ sets, radio and podcasts", category: "Music", isNew: true },
    { name: "Apple Podcasts", icon: Mic, color: "#9146FF", description: "Audio episodes and shows", category: "Music", isNew: true },
    { name: "Spotify", icon: Music2, color: "#1DB954", description: "Song metadata and playlists", category: "Music", isNew: true },
    { name: "Deezer", icon: Music2, color: "#FF0000", description: "Music streaming service", category: "Music", isNew: true },
    { name: "Audiomack", icon: Music2, color: "#FFA200", description: "Music sharing platform", category: "Music", isNew: true },

    // Anime
    { name: "Crunchyroll", icon: Play, color: "#F47521", description: "World's largest anime library", category: "Anime", isNew: true },
    { name: "Bilibili", icon: Play, color: "#00A1D6", description: "Anime and creative videos", category: "Anime", isNew: true },
    { name: "ADN", icon: Tv, color: "#00AEEF", description: "Animation Digital Network", category: "Anime", isNew: true },
    { name: "AnimeOnDemand", icon: Tv, color: "#FF0000", description: "Japanese animation and films", category: "Anime", isNew: true },

    // Entertainment
    { name: "Vimeo", icon: Video, color: "#1AB7EA", description: "High-quality video content", category: "Entertainment" },
    { name: "Twitch", icon: Twitch, color: "#9146FF", description: "Live streams and clips", category: "Entertainment" },
    { name: "DailyMotion", icon: Play, color: "#0066DC", description: "News and trending videos", category: "Entertainment" },
    { name: "Steam", icon: Gamepad2, color: "#171a21", description: "Game trailers and broadcasts", category: "Entertainment", isNew: true },
    { name: "Odysee", icon: Video, color: "#EF1970", description: "LBRY-based video platform", category: "Entertainment", isNew: true },
    { name: "Rumble", icon: Video, color: "#85B739", description: "Independent video hosting", category: "Entertainment", isNew: true },
    { name: "BitChute", icon: Video, color: "#C10000", description: "Peer-to-peer video hosting", category: "Entertainment", isNew: true },
    { name: "Douyin", icon: Music2, color: "#000000", description: "Chinese version of TikTok", category: "Entertainment", isNew: true },
    { name: "YOUKU", icon: Video, color: "#00A6E3", description: "Premier Chinese video hosting", category: "Entertainment", isNew: true },
    { name: "ESPN", icon: Video, color: "#CC0000", description: "Sports clips and highlights", category: "Entertainment", isNew: true },
    { name: "BBC", icon: Video, color: "#000000", description: "Global news and documentaries", category: "Entertainment", isNew: true },
    { name: "TED", icon: Clapperboard, color: "#E62B1E", description: "Talks and educational presentations", category: "Entertainment", isNew: true },
    { name: "GitHub", icon: Github, color: "#181717", description: "Repository media and assets", category: "Entertainment" },
];

export const PlatformsPage = () => {
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<Category>("All");

    const filteredPlatforms = useMemo(() => {
        return PLATFORMS.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.description.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === "All" || p.category === activeCategory;
            return matchesSearch && matchesCategory;
        });
    }, [search, activeCategory]);

    return (
        <div className="flex flex-col gap-8 max-w-6xl pb-10">
            <div className="flex flex-col gap-4">
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

                {/* Category Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none mt-4">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border",
                                activeCategory === cat
                                    ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                    : "bg-white dark:bg-white/5 text-slate-500 dark:text-gray-400 border-gray-100 dark:border-glass-border hover:bg-gray-50 dark:hover:bg-white/10"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
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
                                <span className="font-bold text-slate-900 dark:text-white leading-tight">{platform.name}</span>
                                <span className="text-[9px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">{platform.category}</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400 line-clamp-2 leading-relaxed h-8">
                            {platform.description}
                        </p>
                    </div>
                ))}

                {filteredPlatforms.length === 0 && (
                    <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-400 dark:text-gray-500 gap-4">
                        <Globe size={48} className="opacity-20" />
                        <span className="text-sm">No platforms matching your search or category</span>
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
