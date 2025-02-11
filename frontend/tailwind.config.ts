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
      boxShadow: {
        'custom-light': '0 0 2px #191516',
        'custom-dark': '0 0 2px #FCEEF5',
      },
      colors: {
        light: {
          background: '#FCEEF5',
          text: '#191516',
          'primary-button': '#F2BBD5',
          'secondary-button': '#191516',
          'button-text': '#191516',
          'button-hover': '#f3c8da',
          'button-text-hover': '#6d085a',
          'form-field': '#ffffff',
          accent: '#8a0b6f',
          error: '#d9233f',
        },
        dark: {
          background: '#191516',
          text: '#FCEEF5',
          'primary-button': '#F2BBD5',
          'secondary-button': '#FCEEF5',
          'button-text': '#191516',
          'button-hover': '#e3c3d4',
          'button-text-hover': '#d3b4c2',
          'form-field': '#2D282A',
          accent: '#8a0b6f',
          error: '#d9233f',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;