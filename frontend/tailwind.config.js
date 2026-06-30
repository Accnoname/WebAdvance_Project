/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          900: '#7c2d12'
        },
        dark: {
          800: '#1e1b1b',
          900: '#111111'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'serif'],
        body: ['Outfit', 'sans-serif'],
        admin: ['"Syne"', 'sans-serif'],
        staff: ['"DM Sans"', 'sans-serif'],
        mono: ['"DM Mono"', 'monospace'],
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.6s ease-out forwards',
      }
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
