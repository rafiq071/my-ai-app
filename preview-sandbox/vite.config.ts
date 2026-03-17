import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: "/preview/",
  plugins: [react()],
  build: {
    outDir: path.join(__dirname, "../dist/preview"),
    emptyOutDir: true,
  },
});
