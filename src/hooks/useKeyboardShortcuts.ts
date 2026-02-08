import { useEffect } from "react";
import { useDownloadStore } from "@/state/useDownloadStore";

export const useKeyboardShortcuts = () => {
    const { analyzeUrl, cancelAnalysis, analysisCtx } = useDownloadStore();

    useEffect(() => {
        const handleKeyDown = async (e: KeyboardEvent) => {
            // Cmd+V or Ctrl+V (Handled by smart clipboard hook mostly, but here for manual)
            // Actually, we don't want to override OS behavior for paste in inputs.

            // Esc to cancel analysis
            if (e.key === "Escape" && analysisCtx) {
                cancelAnalysis();
            }

            // More global shortcuts can go here
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [analysisCtx, cancelAnalysis, analyzeUrl]);
};
