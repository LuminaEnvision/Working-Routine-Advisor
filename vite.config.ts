import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 5173,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  optimizeDeps: {
    exclude: ["pinata-sdk", "@glennsl/bs-json", "bs-platform", "bs-fetch"],
    include: ["buffer"],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (
              id.includes("wagmi") ||
              id.includes("viem") ||
              id.includes("@walletconnect")
            ) {
              return "wagmi";
            }
            if (id.includes("@radix-ui")) {
              return "radix";
            }
            if (id.includes("@tanstack") || id.includes("react-query")) {
              return "react-query";
            }
            if (id.includes("lucide-react")) {
              return "icons";
            }
          }
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
});
