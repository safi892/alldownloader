import React from "react";
import {
    Download,
    History,
    MonitorPlay,
    Globe,
    Settings,
    Play
} from "lucide-react";
import { cn } from "@/utils/cn";
import { NavLink } from "react-router-dom";

interface SidebarItemProps {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    to: string;
    collapsed?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
    icon: Icon,
    label,
    to,
    collapsed,
}) => {
    return (
        <NavLink
            to={to}
            className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all group",
                isActive
                    ? "bg-primary shadow-lg shadow-primary/25 text-white"
                    : "hover:bg-slate-200/50 dark:hover:bg-white/5 text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
            )}
            title={collapsed ? label : undefined}
        >
            {({ isActive }) => (
                <>
                    <Icon
                        className={cn(
                            "w-6 h-6 transition-transform",
                            isActive ? "text-white" : "group-hover:scale-110"
                        )}
                    />
                    {!collapsed && (
                        <span className="text-sm font-medium leading-normal">
                            {label}
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

    return (
        <aside className={cn(
            "flex flex-col justify-between border-r border-gray-200 dark:border-glass-border bg-gray-50 dark:bg-surface-dark/50 backdrop-blur-xl transition-all duration-300 h-screen",
            collapsed ? "w-20" : "w-64"
        )}>
            <div className="flex flex-col gap-6 p-4">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2">
                    <div className="bg-gradient-to-br from-primary to-purple-600 rounded-xl size-10 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                        <Play className="text-white fill-current" size={20} />
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
                    <SidebarItem icon={Download} label="Downloads" to="/" />
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
                            <p className="text-slate-900 dark:text-white text-xs font-semibold">Alex Designer</p>
                            <p className="text-slate-500 dark:text-[#a19db9] text-[10px]">Premium Plan</p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
};
