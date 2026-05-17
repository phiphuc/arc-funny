import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { 50:"#eff6ff", 500:"#3b82f6", 600:"#2563eb", 900:"#1e3a8a" },
        arc: { DEFAULT:"#7C3AED", dark:"#5B21B6" }
      },
      fontFamily: { sans: ["Inter","system-ui","sans-serif"] }
    }
  },
  plugins: [],
} satisfies Config;
