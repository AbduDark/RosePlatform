import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    watch: {
      usePolling: true,
    },
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY_TARGET || "http://nginx",
        changeOrigin: true,
      },
      "/storage": {
        target: process.env.VITE_API_PROXY_TARGET || "http://nginx",
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ["react-player", "tailwindcss"],
  },
});
