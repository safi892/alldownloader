import { useState, useEffect } from 'react';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useDownloadStore } from '@/state/useDownloadStore';

const URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|x\.com|twitter\.com)\/.+$/i;

export const useSmartClipboard = () => {
    const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
    const [lastChecked, setLastChecked] = useState<string>("");
    const clipboardDetection = useDownloadStore(state => state.settings.clipboardDetection);

    useEffect(() => {
        if (!clipboardDetection) {
            setDetectedUrl(null);
            return;
        }

        const checkClipboard = async () => {
            try {
                const text = await readText();
                if (text && text !== lastChecked && URL_REGEX.test(text)) {
                    setDetectedUrl(text);
                    setLastChecked(text);
                }
            } catch (e) {
                console.error("Clipboard read failed", e);
            }
        };

        const unlisten = getCurrentWindow().onFocusChanged(({ payload: focused }) => {
            if (focused) {
                checkClipboard();
            }
        });

        checkClipboard();

        return () => {
            unlisten.then(f => f());
        };
    }, [lastChecked, clipboardDetection]);

    const clearDetected = () => setDetectedUrl(null);

    return { detectedUrl, clearDetected };
};
