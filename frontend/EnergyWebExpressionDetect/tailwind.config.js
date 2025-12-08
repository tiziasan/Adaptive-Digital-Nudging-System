/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        happy: '#D1FAE5', // light green
        sad: '#c580ed', // light purple
        angry: '#FECACA', // light red
        surprised: '#FEF9C3', // light yellow
        neutral: '#F3F4F6', // light gray
        disgusted: '#f59e73', // light brown
      },
    },
  },
  plugins: [],
};
