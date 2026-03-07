/**
 * Global WebContainer preview manager (Lovable/Bolt style).
 * Re-exports from previewManager so the manager lives under previewRunner.ts entry.
 */
export {
  runPreview,
  updateFile,
  updateFiles,
  runBuild,
  killDevServer,
  isDevServerRunning,
  onServerReady,
  onPreviewError,
  onStatus,
} from "./previewManager";
