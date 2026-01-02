/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class', // Enable dark mode via class strategy (Hubbi Core handles this)
    theme: {
        extend: {
            colors: {
                hubbi: {
                    bg: 'var(--hubbi-bg)',
                    card: 'var(--hubbi-card)',
                    text: 'var(--hubbi-text)',
                    'text-dim': 'var(--hubbi-text-dim)',
                    border: 'var(--hubbi-border)',
                    primary: 'var(--hubbi-primary)',
                    'primary-fg': 'var(--hubbi-primary-fg)',
                    secondary: 'var(--hubbi-secondary)',
                    destructive: 'var(--hubbi-destructive)',
                }
            }
        },
    },
    plugins: [],
}
