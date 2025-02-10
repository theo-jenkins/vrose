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
      fontFamily: {
        custom: ['DM-Sans', 'sans-serif'],
      },
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
          text: '#191516',
          button: '#191516',
          'button-text': '#8a0b6f',
          'button-hover': '#f3c8da',
          'button-text-hover': '#6d085a',
          'form-field': '#ffffff',
          accent: '#8a0b6f',
          error: '#d9233f',
        },
        dark: {
          background: '#191516',
          text: '#f5dbe8',
          button: '#f5dbe8',
          'button-text': '#191516',
          'button-hover': '#e3c3d4',
          'button-text-hover': '#d3b4c2',
          'form-field': '#f5dbe8',
          accent: '#8a0b6f',
          error: '#d9233f',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;