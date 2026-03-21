
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        wellness: {
          bg: '#F8F6F3',
          blue: '#6B9FD4',
          'blue-light': '#E8F4FD',
          'blue-mid': '#B8D8E8',
          green: '#7BC8A4',
          'green-light': '#E8F5E9',
          peach: '#F4A89A',
          'peach-light': '#FDDCCC',
          lavender: '#D4B8E8',
          text: '#2D3748',
          'text-sec': '#718096',
          'text-muted': '#A0AEC0',
          border: '#E2E8F0',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(107, 159, 212, 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.7 },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
