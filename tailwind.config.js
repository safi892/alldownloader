/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                "primary": "rgb(var(--color-primary) / <alpha-value>)",
                "background-light": "rgb(var(--color-background-light) / <alpha-value>)",
                "background-dark": "rgb(var(--color-background-dark) / <alpha-value>)",
                "surface-dark": "rgb(var(--color-surface-dark) / <alpha-value>)",
                "glass-border": "rgb(var(--color-glass-border) / 0.08)",
                "glass-surface": "rgb(var(--color-surface-dark) / 0.7)",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
