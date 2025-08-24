
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: '#16A34A',
        'primary-hover': '#15803D',
        'primary-soft': '#DCFCE7',
        accent: '#A3E635',
        'text-primary': '#111827',
        'text-secondary': '#4B5563',
        'bg-main': '#F9FAFB'
      },
      fontFamily: {
        'kanit': ['Kanit', 'sans-serif'],
        'prompt': ['Prompt', 'sans-serif']
      }
    }
  },
  plugins: []
}
