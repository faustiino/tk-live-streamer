import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // opcional: atalhos bonitos
      "@ui": path.resolve(__dirname, "../..", "packages/ui/src")
    }
  },
  optimizeDeps: {
    // importante pra evitar que o Vite tente pré-bundlar sua lib já transpilada
    include: ["react", "react-dom"]
  }
});
