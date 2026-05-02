/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        philly: {
          orange: '#FF6200',
          'orange-dark': '#CC4E00',
          'orange-light': '#FF8533',
          black: '#0A0A0A',
          green: '#006F5C',
          'green-light': '#00936B',
          gold: '#FFB612',
          white: '#F5F5F5',
          dark: '#0D0D0D',
          'dark-2': '#1A1A1A',
          'dark-3': '#252525',
          'dark-4': '#2E2E2E',
        },
        transit: {
          bus: '#0057A8',
          trolley: '#006F5C',
          subway: '#FF6200',
          rail: '#C5001A',
          patco: '#7C3AED',
        },
      },
      fontFamily: {
        display: ['system-ui', 'Impact', 'Arial Black', 'sans-serif'],
        body: ['system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-orange': '0 0 12px rgba(255, 98, 0, 0.6)',
        'glow-green': '0 0 12px rgba(0, 111, 92, 0.6)',
        'glow-blue': '0 0 12px rgba(0, 87, 168, 0.6)',
        'panel': '0 -4px 20px rgba(0,0,0,0.6)',
        'card': '0 4px 20px rgba(0,0,0,0.5)',
      },
      backgroundImage: {
        'philly-pattern': "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FF6200' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-out': 'fadeOut 0.3s ease-out forwards',
        'marquee': 'marquee 25s linear infinite',
        'pulse-orange': 'pulseOrange 2s ease-in-out infinite',
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97)',
        'spin-slow': 'spin 3s linear infinite',
        'bus-run': 'busRun 1.5s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        pulseOrange: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(255,98,0,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(255,98,0,0.8)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        busRun: {
          '0%': { transform: 'translateX(-10px)' },
          '50%': { transform: 'translateX(10px)' },
          '100%': { transform: 'translateX(-10px)' },
        },
      },
      screens: {
        xs: '375px',
      },
    },
  },
  plugins: [],
}
