export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0055FF',
          dark: '#0044CC',
          light: '#3377FF',
        },
        bg: {
          primary: '#0B0F19',
          secondary: '#161B26',
          tertiary: '#1F2633',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#A0AEC0',
          muted: '#718096',
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
