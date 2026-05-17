import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        available: "#10b981",
        availableHover: "#059669",
        occupied: "#ef4444",
        booked: "#3b82f6",
      },
    },
  },
  plugins: [],
};

export default config;
