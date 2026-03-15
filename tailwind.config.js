/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#D4AF37',
          light: '#F0D060',
          dark: '#B8960C',
          muted: '#8A6E20',
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
        'gold-shimmer': 'linear-gradient(105deg, #B8960C 0%, #D4AF37 40%, #F0D060 50%, #D4AF37 60%, #B8960C 100%)',
      },
      animation: {
        'shimmer': 'shimmer 3s infinite linear',
        'fade-up': 'fadeUp 0.6s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
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
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(212,175,55,0)' },
        }
      }
    },
  },
  plugins: [],
}
