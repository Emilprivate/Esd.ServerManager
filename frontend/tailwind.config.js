module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          900: "#1a1a1a",
          800: "#2a2a2a",
          700: "#3a3a3a",
        },
      },
      animation: {
        blob: "blob 10s infinite",
        "fade-in": "fadeIn 1s forwards",
      },
      keyframes: {
        blob: {
          "0%": { transform: "scale(1) translate(0px, 0px)" },
          "33%": { transform: "scale(1.2) translate(30px, -20px)" },
          "66%": { transform: "scale(0.8) translate(-20px, 20px)" },
          "100%": { transform: "scale(1) translate(0px, 0px)" },
        },
        fadeIn: {
          from: { opacity: 0, transform: "translateY(20px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
