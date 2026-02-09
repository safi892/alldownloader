import { useDownloadStore } from "@/state/useDownloadStore";
import { cn } from "@/utils/cn";
import { Button } from "@/ui/primitives/Button";
import { Input } from "@/ui/primitives/Input";
import {
    Layers,
    Lock,
    Folder,
    Bell,
    ChevronRight,
    Monitor
} from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";

export const SettingsPage = () => {
    const { settings, updateSettings, downloadPath, setDownloadPath } = useDownloadStore();

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
        <div className="flex flex-col gap-8 max-w-4xl">
            <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                    Settings
                </h2>
                <p className="text-slate-500 dark:text-gray-400 mt-2 font-medium">Configure VidFlow to match your workflow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Concurrency Section */}
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-[#1e1b2e]/60 border border-gray-200 dark:border-glass-border backdrop-blur-xl flex flex-col gap-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <Layers className="text-primary" size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Download Engine</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Limit Concurrency</span>
                                <span className="text-xs text-slate-400 dark:text-gray-500">Enable queue system</span>
                            </div>
                            <button
                                onClick={() => updateSettings({ concurrencyMode: !settings.concurrencyMode })}
                                className={`w-12 h-6 rounded-full transition-colors relative ${settings.concurrencyMode ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-700'}`}
                            >
                                <div className={`absolute top-1 left-1 size-4 bg-white rounded-full transition-transform ${settings.concurrencyMode ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        {settings.concurrencyMode && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700 dark:text-slate-200">Max active downloads</span>
                                <Input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={settings.maxConcurrent}
                                    onChange={(e) => updateSettings({ maxConcurrent: parseInt(e.target.value) || 1 })}
                                    className="w-20 text-center bg-gray-100 dark:bg-black/40 h-8 text-slate-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Storage Section */}
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-[#1e1b2e]/60 border border-gray-200 dark:border-glass-border backdrop-blur-xl flex flex-col gap-6 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Folder className="text-purple-400" size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Storage</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Download Location</span>
                            <div className="flex gap-2">
                                <Input
                                    value={downloadPath || "Not set (Destktop by default)"}
                                    readOnly
                                    className="bg-gray-100 dark:bg-black/40 text-xs text-slate-500 dark:text-gray-400 truncate flex-1 border-gray-200 dark:border-glass-border"
                                />
                                <Button size="sm" variant="outline" onClick={handleChooseFolder} className="border-gray-200 dark:border-glass-border text-slate-700 dark:text-white">
                                    Change
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Authentication Section */}
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-[#1e1b2e]/60 border border-gray-200 dark:border-glass-border backdrop-blur-xl flex flex-col gap-6 md:col-span-2 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Lock className="text-green-500 dark:text-green-400" size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Advanced Authentication</h3>
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">YouTube/Site Cookies</span>
                            <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase tracking-widest font-bold">Recommended for Age-Restricted Content</span>
                        </div>
                        <textarea
                            className="bg-gray-100 dark:bg-[#131022] border border-gray-200 dark:border-glass-border rounded-xl p-4 text-xs font-mono text-slate-600 dark:text-gray-400 min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all w-full"
                            placeholder="# Netscape HTTP Cookie File..."
                            value={settings.cookies || ""}
                            onChange={(e) => updateSettings({ cookies: e.target.value || null })}
                        />
                        <p className="text-[10px] text-slate-400 dark:text-gray-500 italic">
                            Tip: Use a "Cookie Editor" extension to export cookies in Netscape format and paste them here.
                        </p>
                    </div>
                </div>

                {/* App Section */}
                <div className="p-6 rounded-2xl bg-white/50 dark:bg-[#1e1b2e]/60 border border-gray-200 dark:border-glass-border backdrop-blur-xl flex flex-col gap-6 md:col-span-2 shadow-sm dark:shadow-none">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Monitor className="text-blue-500 dark:text-blue-400" size={20} />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">Appearance & Behavior</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        {/* Theme Toggle */}
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">App Theme</span>
                            <div className="flex p-1 bg-gray-100 dark:bg-black/40 rounded-xl w-fit border border-gray-200 dark:border-none">
                                {(['dark', 'light', 'system'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => updateSettings({ theme: t })}
                                        className={cn(
                                            "px-4 py-1.5 rounded-lg text-xs capitalize transition-all",
                                            settings.theme === t ? "bg-primary text-white shadow-lg" : "text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
                                        )}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Post-Download Action Placeholder (Example: Open folder) */}
                        <div className="flex flex-col gap-3">
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Post-Download Action</span>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 text-xs text-slate-500 dark:text-gray-400">
                                    Show in folder after completion
                                </div>
                                <button
                                    className="w-10 h-5 rounded-full bg-gray-300 dark:bg-gray-700 relative"
                                    onClick={() => { }} // TODO: Implement if needed
                                >
                                    <div className="absolute top-0.5 left-0.5 size-4 bg-white rounded-full translate-x-5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-3">
                                <Bell className="text-slate-400 dark:text-gray-400" size={18} />
                                <span className="text-sm text-slate-700 dark:text-slate-200">Native Notifications</span>
                            </div>
                            <ChevronRight size={16} className="text-slate-300 dark:text-gray-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none">
                            <div className="flex items-center gap-3">
                                <div className="size-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm text-slate-700 dark:text-slate-200">Auto-update yt-dlp</span>
                            </div>
                            <span className="text-[10px] bg-green-500/20 text-green-500 dark:text-green-400 px-2 py-0.5 rounded-full font-bold">ON</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4">
                <Button variant="ghost" className="text-gray-400">Cancel</Button>
                <Button className="px-10 shadow-lg shadow-primary/20">Save Settings</Button>
            </div>
        </div>
    );
};
