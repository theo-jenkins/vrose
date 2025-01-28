import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      animation: {
        spinEase: 'spin-ease 0.6s ease-in-out',
      },
      keyframes: {
        'spin-ease': {
          '0%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(180deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      },
      colors: {
        light: {
          background: '#fbeff2',
          text: '#8a0b6f',
          button: '#f5dbe8',
          accent: '#8a0b6f',
          'button-text': '#8a0b6f',
          'form-field': '#ffffff',
          'button-hover': '#f3c8da',
          'button-text-hover': '#6d085a',
          error: '#d9233f',
        },
        dark: {
          background: '#191516',
          text: '#f5dbe8',
          button: '#f5dbe8',
          accent: '#8a0b6f',
          'button-text': '#191516',
          'form-field': '#f5dbe8',
          'button-hover': '#e3c3d4',
          'button-text-hover': '#d3b4c2',
          error: '#d9233f',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
