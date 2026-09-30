export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        
        primary: {
          DEFAULT: "#0B2A5B",
          50: "#EAF1FB",
          100: "#D3E2F6",
          200: "#A7C5ED",
          300: "#6E9EDD",
          400: "#3E75C4",
          500: "#1E56A6",
          600: "#123E82",
          700: "#0B2A5B",
          800: "#081E42",
          900: "#05142C",
        },
       
        canvas: "#F4F8FD",
        surface: "#FFFFFF",
        line: "#E1E9F4",
        
        ink: "#0F1B33",
        muted: "#5B6B85",
        faint: "#93A2BB",
        
        coral: { DEFAULT: "#E5484D", bg: "#FDEBEC" },
        mint: { DEFAULT: "#1FA971", bg: "#E4F7EF" },
        sky: { DEFAULT: "#2D8CF0", bg: "#E9F3FE" },
        violet: { DEFAULT: "#7C6FE0", bg: "#F0EEFC" },
        amber: { DEFAULT: "#F0A620", bg: "#FEF3DE" },
      },
      fontFamily: {
        display: ["'Plus Jakarta Sans'", "sans-serif"],
        body: ["'Plus Jakarta Sans'", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "10px",
        card: "18px",
        panel: "28px",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 2px 8px -2px rgba(11,42,91,0.06)",
        card: "0 12px 32px -12px rgba(11,42,91,0.14)",
        "card-lg": "0 24px 60px -20px rgba(11,42,91,0.22)",
        glow: "0 8px 24px -6px rgba(11,42,91,0.35)",
      },
      backgroundImage: {
        "hero-radial":
          "radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 55%)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 5s ease-in-out infinite",
        fadeUp: "fadeUp 0.5s ease-out both",
      },
    },
  },
  plugins: [],
};
