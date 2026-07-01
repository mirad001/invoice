/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Uses CSS variables set at runtime per active company.
        // --accent and --accent-dark are space-separated RGB triplets (e.g. "30 136 229")
        // so Tailwind's opacity modifiers like bg-accent/10 work correctly.
        accent: {
          DEFAULT: 'rgb(var(--accent, 30 136 229) / <alpha-value>)',
          dark:    'rgb(var(--accent-dark, 21 101 192) / <alpha-value>)',
          light:   'rgb(var(--accent-light, 96 165 250) / <alpha-value>)',
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
        invoice: '0 4px 40px rgba(0,0,0,0.08)',
        card: '0 2px 12px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
