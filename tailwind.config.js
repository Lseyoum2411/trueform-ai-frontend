/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0a0a',
          surface: '#1a1a1a',
          border: '#2a2a2a',
        },
      },
      fontFamily: {
        geist: ['system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

