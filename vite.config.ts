import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// Entferne das cloudflare Plugin temporär
// import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react()], // Entferne cloudflare()
  root: "src/react-app",
  publicDir: "public",
  css: {
    devSourcemap: true,
    postcss: './postcss.config.js'
  },
  build: {
    outDir: "../../dist/assets",
    emptyOutDir: false, // Auf false setzen, damit worker.js nicht gelöscht wird
    rollupOptions: {
      output: {
        entryFileNames: "[name].js",
        chunkFileNames: "[name].js",
        assetFileNames: "[name].[ext]"
      }
    }
  }
});
