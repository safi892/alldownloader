import React from "react";
import { Sidebar } from "@/ui/components/Sidebar/Sidebar";

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-white dark:bg-background-dark text-slate-900 dark:text-white">
            <Sidebar />
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                {/* Decorative Background Blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute top-[-20%] left-[10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-purple-600/5 dark:bg-purple-600/10 rounded-full blur-[100px]" />
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto z-10 p-6 lg:p-10 scroll-smooth">
                    <div className="max-w-5xl mx-auto flex flex-col gap-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
