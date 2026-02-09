/**
 * Utilities for formatting download-related data
 */

export const formatBytes = (bytes: number | null | undefined): string => {
    if (bytes === null || bytes === undefined) return "-";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatSpeed = (bytesPerSec: number | null | undefined): string => {
    if (!bytesPerSec) return "-";
    return formatBytes(bytesPerSec) + "/s";
};

export const formatETA = (seconds: number | null | undefined): string => {
    if (seconds === null || seconds === undefined) return "-";
    if (seconds < 0) return "Unknown";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
};
