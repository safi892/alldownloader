import { Clipboard, X } from "lucide-react";
import { Button } from "@/ui/primitives/Button";
import { useDownloadStore } from "@/state/useDownloadStore";
import { motion } from "framer-motion";

interface ClipboardToastProps {
    url: string;
    onClear: () => void;
}

export const ClipboardToast = ({ url, onClear }: ClipboardToastProps) => {
    const setPrefillUrl = useDownloadStore(state => state.setPrefillUrl);

    const handlePaste = () => {
        setPrefillUrl(url);
        onClear();
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 min-w-[320px] max-w-md"
        >
            <div className="bg-white/95 dark:bg-[#1e1b2e]/90 backdrop-blur-xl border border-primary/20 dark:border-primary/30 p-4 rounded-2xl shadow-2xl flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                    <Clipboard size={20} className="text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-black uppercase tracking-wider mb-0.5">Clipboard Detected</p>
                    <p className="text-sm text-slate-600 dark:text-gray-300 truncate font-bold">{url}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <Button
                        size="sm"
                        onClick={handlePaste}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-4 rounded-xl shadow-lg shadow-primary/20"
                    >
                        Paste
                    </Button>
                    <button
                        onClick={onClear}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 dark:text-gray-400 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
