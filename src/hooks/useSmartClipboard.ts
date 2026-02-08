import { useState, useEffect } from 'react';
import { readText } from '@tauri-apps/plugin-clipboard-manager';
import { getCurrentWindow } from '@tauri-apps/api/window';

const URL_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|x\.com|twitter\.com)\/.+$/i;

export const useSmartClipboard = () => {
    const [detectedUrl, setDetectedUrl] = useState<string | null>(null);
    const [lastChecked, setLastChecked] = useState<string>("");

    useEffect(() => {
        const checkClipboard = async () => {
            // Only check if window is focused? 
            // Ideally we want to check when the user comes back to the app.
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

        // Initial check too?
        checkClipboard();

        return () => {
            unlisten.then(f => f());
        };
    }, [lastChecked]);

    const clearDetected = () => setDetectedUrl(null);

    return { detectedUrl, clearDetected };
};
