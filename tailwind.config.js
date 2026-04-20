/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hotelNavy: '#0A1128', 
        hotelGold: '#D4AF37', 
        hotelSoftWhite: '#F8F9FA',
      },
      fontFamily: {
        luxury: ['"Playfair Display"', 'serif'],
      },
      keyframes: {
        'loading-bar': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'slow-zoom': {
          '0%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1.15)' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        // Essential for the Secret Portal logic
        'loading-bar': 'loading-bar 2s infinite linear',
        // Essential for the Hero and About images
        'slow-zoom': 'slow-zoom 20s infinite alternate ease-in-out',
        // Essential for the Home/About headers
        'fade-in': 'fade-in 1.5s cubic-bezier(0.21, 0.6, 0.35, 1) forwards',
        // Subtlety for the Solar/Icon system
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}