/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#B8C4D0',
          light: '#DCE3EC',
          dark: '#8A97A8',
          muted: '#6B7A8A',
        },
        obsidian: {
          DEFAULT: '#080808',
          light: '#111111',
          mid: '#1A1A1A',
          border: '#242424',
        }
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body: ['"Outfit"', 'sans-serif'],
      },
      backgroundImage: {
        'gold-shimmer': 'linear-gradient(105deg, #8A97A8 0%, #B8C4D0 40%, #DCE3EC 50%, #B8C4D0 60%, #8A97A8 100%)',
      },
      animation: {
        'shimmer': 'shimmer 3s infinite linear',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'pulse-silver': 'pulseGold 2s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(184,196,208,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(184,196,208,0)' },
        }
      }
    },
  },
  plugins: [],
}
