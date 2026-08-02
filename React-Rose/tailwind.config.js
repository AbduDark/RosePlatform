import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export const content = ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"];
export const darkMode = 'class';
export const theme = {
  extend: {
    colors: {
      primary: "#06d4b5ff",
      secondary: "#3B82F6",
    },
    fontFamily: {
      arabic: ["Cairo", "sans-serif"],
      sans: ["Inter", "ui-sans-serif", "system-ui"],
    },
    animation: {
      'fade-in': 'fadeIn 0.3s ease-in-out',
      'slide-down': 'slideDown 0.3s ease-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'scale-in': 'scaleIn 0.2s ease-out',
    },
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideDown: {
        '0%': { transform: 'translateY(-10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      slideUp: {
        '0%': { transform: 'translateY(10px)', opacity: '0' },
        '100%': { transform: 'translateY(0)', opacity: '1' },
      },
      scaleIn: {
        '0%': { transform: 'scale(0.95)', opacity: '0' },
        '100%': { transform: 'scale(1)', opacity: '1' },
      },
    },
  },
};
export const plugins = [];
