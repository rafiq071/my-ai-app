import { createServer } from "vite";
import react from "@vitejs/plugin-react";

export async function startPreviewServer(projectPath: string) {
  const server = await createServer({
    root: projectPath,
    plugins: [react()],
    server: {
      port: 5174,
      strictPort: true,
    },
  });

  await server.listen();
  return server;
}
