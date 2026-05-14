import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0a0a0a",
        sumi: "#111111",
        washi: "#ededed",
        kin: "#c9a96a",
        kinDeep: "#8a7240",
        ai: "#1b2a4e",
        aiDeep: "#0e1730",
      },
      fontFamily: {
        serif: ['"Shippori Mincho"', '"Noto Serif JP"', "serif"],
        sans: ['"Noto Sans JP"', "sans-serif"],
      },
      letterSpacing: {
        widest2: "0.35em",
      },
      animation: {
        "fade-in": "fadeIn 1.2s ease forwards",
        "fade-up": "fadeUp 1.1s cubic-bezier(.2,.7,.2,1) forwards",
        "slow-pulse": "slowPulse 4s ease-in-out infinite",
        "ink-spread": "inkSpread 2.4s ease-out forwards",
        "torii-breath": "toriiBreath 6s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slowPulse: {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        inkSpread: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "60%": { opacity: "0.5" },
          "100%": { transform: "scale(1.4)", opacity: "0" },
        },
        toriiBreath: {
          "0%,100%": { opacity: "0.25", transform: "translateY(0)" },
          "50%": { opacity: "0.55", transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
