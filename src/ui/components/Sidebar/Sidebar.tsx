import React from "react";
import {
    Download,
    History,
    MonitorPlay,
    Globe,
    Settings
} from "lucide-react";
import { cn } from "@/utils/cn";
import { NavLink } from "react-router-dom";
import { useDownloadStore } from "@/state/useDownloadStore";

interface SidebarItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    to: string;
    collapsed?: boolean;
    badge?: number | string;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    icon: Icon,
    label,
    to,
    collapsed,
    badge
}) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group relative",
                isActive
                    ? "bg-primary shadow-lg shadow-primary/25 text-white"
                    : "hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            )}
            title={collapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    <div className="relative">
                        <Icon
                            className={cn(
                                "w-6 h-6 transition-transform",
                                isActive ? "text-white" : "group-hover:scale-110"
                            )}
                        />
                        {collapsed && badge && (
                            <span className="absolute -top-2 -right-2 bg-primary dark:bg-primary-dark text-white text-[8px] font-black w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-surface-dark">
                                {badge}
                            </span>
                        )}
                    </div>
                    {!collapsed && (
                        <span className="text-sm font-medium leading-normal flex-1">
                            {label}
                        </span>
                    )}
                    {!collapsed && badge && (
                        <span className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full",
                            isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary animate-pulse"
                        )}>
                            {badge}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

export const Sidebar = () => {
    // In a real app, this would be controlled by state or media queries
    const collapsed = false;
    const tasks = useDownloadStore(state => state.tasks);
    const activeCount = tasks.filter(t => ['downloading', 'queued', 'preparing', 'merging'].includes(t.status)).length;

    return (
        <aside className={cn(
            "flex flex-col justify-between border-r border-gray-200 dark:border-glass-border bg-gray-50 dark:bg-surface-dark/50 backdrop-blur-xl transition-all duration-300 h-screen",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className="flex flex-col gap-6 p-4">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2">
                    <div className="size-10 flex items-center justify-center shrink-0">
                        <svg viewBox="0 0 128 128" className="size-8" xmlns="http://www.w3.org/2000/svg">
                            <path d="M85.76 49.92A13.1 13.1 0 0 1 72.62 63a13.1 13.1 0 0 1-13.14-13.08 13.1 13.1 0 0 1 13.14-13.07 13.1 13.1 0 0 1 13.14 13.07Z" fill="#FFC131" />
                            <path d="M63.74 86.66A13.1 13.1 0 0 1 50.6 99.73a13.1 13.1 0 0 1-13.15-13.07A13.1 13.1 0 0 1 50.6 73.58a13.1 13.1 0 0 1 13.14 13.08Z" fill="#24C8DB" />
                            <path d="M40.58 38.15C17.9 42.77.84 62.73.84 86.65c0 27.35 22.28 49.51 49.76 49.51a49.75 49.75 0 0 0 47.51-34.78 57.88 57.88 0 0 1-19.03 5.55A35.02 35.02 0 0 1 50.6 121.5a34.93 34.93 0 0 1-35.02-34.84 34.87 34.87 0 0 1 22.97-32.73 34.8 34.8 0 0 1-2.03-15.78Z" fill="#24C8DB" />
                            <path fill-rule="evenodd" clip-rule="evenodd" d="M82.64 98.43c22.67-4.61 39.74-24.58 39.74-48.5C122.38 22.57 100.1.41 72.62.41A49.75 49.75 0 0 0 25.11 35.2a57.87 57.87 0 0 1 19.03-5.55 35.03 35.03 0 0 1 28.48-14.57 34.93 34.93 0 0 1 35.02 34.84 34.87 34.87 0 0 1-22.97 32.73 34.8 34.8 0 0 1-2.03 15.78Z" fill="#FFC131" />
                        </svg>
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <h1 className="text-slate-900 dark:text-white text-lg font-bold leading-none tracking-tight">VidFlow</h1>
                            <p className="text-slate-500 dark:text-[#a19db9] text-xs font-medium">Pro Downloader</p>
                        </div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex flex-col gap-2 mt-4">
                    <SidebarItem icon={Download} label="Downloads" to="/" badge={activeCount > 0 ? activeCount : undefined} />
                    <SidebarItem icon={History} label="History" to="/history" />
                    <SidebarItem icon={MonitorPlay} label="Channels" to="/channels" />
                    <SidebarItem icon={Globe} label="Platforms" to="/platforms" />
                </nav>
            </div>

            {/* Bottom Section */}
            <div className="p-4 border-t border-gray-200 dark:border-glass-border">
                <SidebarItem icon={Settings} label="Settings" to="/settings" collapsed={collapsed} />

                {!collapsed && (
                    <div className="mt-4 flex items-center gap-3 px-3">
                        <div className="size-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 ring-2 ring-black/5 dark:ring-white/10" />
                        <div className="flex flex-col">
                            <p className="text-slate-900 dark:text-white text-xs font-semibold">Saffi Ullah</p>
                            <a href="https://github.com/safi892/alldownloader" target="_blank" rel="noreferrer" className="text-slate-500 dark:text-[#a19db9] text-[10px] hover:text-primary dark:hover:text-primary transition-colors">
                                GitHub Repo
                            </a>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};
