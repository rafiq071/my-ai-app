import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(__dirname, "preview-sandbox"),
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: true,
  },
});
