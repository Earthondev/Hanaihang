
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Emerald 500
          600: '#059669', // Emerald 600 (Main)
          700: '#047857', // Emerald 700
          800: '#065f46',
          900: '#064e3b',
          DEFAULT: '#059669', // Default to 600
        },
        secondary: { // Gold/Amber for accents
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          DEFAULT: '#d97706',
        },
        neutral: {
          50: '#f8fafc', // Slate
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Semantic aliases
        'brand': '#059669',
        'brand-dark': '#047857',
        'brand-light': '#34d399',
        'accent': '#d97706',
        'bg-main': '#f8fafc',
        'surface': '#ffffff',
      },
      fontFamily: {
        'kanit': ['Kanit', 'sans-serif'],
        'prompt': ['Prompt', 'sans-serif'],
        'sans': ['Inter', 'Prompt', 'sans-serif'], // Professional fallback
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    }
  },
  plugins: []
}
