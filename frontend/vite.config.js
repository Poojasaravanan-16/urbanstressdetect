import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/predict": "http://localhost:5000",
      "/info": "http://localhost:5000",
      "/recent": "http://localhost:5000",
      "/stats": "http://localhost:5000",
    },
  },
});
