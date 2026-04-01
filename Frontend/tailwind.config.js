
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
          bg: '#FBF8F3',
          blue: '#6FA5A5',
          'blue-light': '#CFE6E6',
          'blue-mid': '#CFE3D2',
          green: '#B8D0B8',
          'green-light': '#E8F0E8',
          peach: '#C49490',
          'peach-light': '#F4EFE7',
          lavender: '#9AA69A',
          text: '#2F3E2F',
          'text-sec': '#5F705F',
          'text-muted': '#9AA69A',
          border: '#CFE3D2',
        },
        app: {
          'primary': '#7BAE7F',
          'primary-dark': '#4F7D5C',
          'primary-light': '#DDEAD9',
          'background': '#F6F7F5',
          'card': '#FFFFFF',
          'text-primary': '#2F3E34',
          'text-secondary': '#6B7C72',
          'mood': '#6FBF73',
          'stress': '#E07A7A',
          'energy': '#E6B85C',
        }
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glow': '0 0 20px rgba(111, 165, 165, 0.3)',
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
