import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-redux": ["@reduxjs/toolkit", "react-redux"],
          "vendor-firebase": ["firebase/app", "firebase/auth"],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:8080",
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
          proxy.on("error", (err) => {
            if (err.code === "ECONNABORTED" || err.code === "ECONNRESET") return;
            console.error("[vite proxy]", err.message);
          });
        },
      },
    },
  },
});
