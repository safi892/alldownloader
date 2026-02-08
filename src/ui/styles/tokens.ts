export const tokens = {
    colors: {
        primary: "rgb(var(--color-primary))",
        background: {
            light: "rgb(var(--color-background-light))",
            dark: "rgb(var(--color-background-dark))",
        },
        surface: {
            dark: "rgb(var(--color-surface-dark))",
        },
        glass: {
            border: "rgb(var(--color-glass-border) / 0.08)",
            surface: "rgb(var(--color-surface-dark) / 0.7)",
        },
    },
    spacing: {
        // Tailwind default spacing scale can be referenced here if needed
        // or custom values
        sm: "0.5rem",
        md: "1rem",
        lg: "1.5rem",
        xl: "2rem",
    },
    borderRadius: {
        sm: "0.125rem",
        DEFAULT: "0.25rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.75rem",
        "2xl": "1rem",
        full: "9999px",
    },
} as const;

export type Tokens = typeof tokens;
