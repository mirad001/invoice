/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#1e88e5',
          light: '#42a5f5',
          dark: '#1565c0',
        },
        brand: {
          DEFAULT: '#1a1b1c',
          light: '#2c2d2e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        invoice: '0 4px 40px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
