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
        ide: {
          bg: '#0d1117',
          surface: '#161b22',
          panel: '#1f242c',
          card: '#181d24',
          border: '#30363d',
          borderLight: '#444c56',
          text: '#c9d1d9',
          muted: '#8b949e',
          accent: '#58a6ff',
          accentHover: '#79c0ff',
          success: '#2ea043',
          warning: '#d29922',
          danger: '#f85149',
          ours: '#3fb950',
          theirs: '#58a6ff',
          base: '#d29922',
          proposed: '#a371f7'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
