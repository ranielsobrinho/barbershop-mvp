import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f0',
          100: '#faeddc',
          200: '#f4d9b8',
          300: '#edbe8a',
          400: '#e49c56',
          500: '#de8133',
          600: '#cf6a28',
          700: '#ab5223',
          800: '#894323',
          900: '#6e391f',
          950: '#3c1c0e',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
