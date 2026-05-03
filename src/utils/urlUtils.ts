export const normalizeInputUrl = (input: string): string => {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;

    // If multiple URLs are concatenated, keep only the first one.
    const matches = Array.from(trimmed.matchAll(/https?:\/\//gi));
    if (matches.length >= 2) {
        const start = matches[0].index ?? 0;
        const end = matches[1].index ?? trimmed.length;
        return trimmed.slice(start, end).trim();
    }

    return trimmed;
};
