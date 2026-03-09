/**
 * Preview manager (stub when WebContainer is not available).
 * In-browser preview is disabled for environments that don't support it (e.g. Vercel).
 * Events: onStatus(status) | onPreviewError(error) | onServerReady(url)
 */

import type { ProjectFile } from "../types";

type Listener = (url: string) => void;
type ErrorListener = (message: string) => void;
type StatusListener = (status: "mounting" | "installing" | "starting" | "ready" | "restarting" | "error") => void;

const serverReadyListeners = new Set<Listener>();
const errorListeners = new Set<ErrorListener>();
const statusListeners = new Set<StatusListener>();

function emitError(message: string): void {
  errorListeners.forEach((cb) => cb(message));
}

function emitStatus(status: "mounting" | "installing" | "starting" | "ready" | "restarting" | "error"): void {
  statusListeners.forEach((cb) => cb(status));
}

export function onServerReady(cb: Listener): () => void {
  serverReadyListeners.add(cb);
  return () => serverReadyListeners.delete(cb);
}

export function onPreviewError(cb: ErrorListener): () => void {
  errorListeners.add(cb);
  return () => errorListeners.delete(cb);
}

export function onStatus(cb: StatusListener): () => void {
  statusListeners.add(cb);
  return () => statusListeners.delete(cb);
}

export async function updateFile(_path: string, _content: string): Promise<void> {
  /* no-op: preview not available */
}

export async function updateFiles(_files: { path: string; content: string }[]): Promise<void> {
  /* no-op: preview not available */
}

export async function runPreview(
  files: ProjectFile[],
  iframeRef: { current: HTMLIFrameElement | null },
  _options?: { runBuildBeforeDev?: boolean }
): Promise<void> {
  if (!files?.length) return;
  if (iframeRef.current) iframeRef.current.src = "about:blank";
  emitStatus("error");
  emitError("Preview unavailable in this environment");
}

export async function runBuild(): Promise<{ success: boolean; error?: string }> {
  return { success: false, error: "Preview not available" };
}

export function killDevServer(): void {
  /* no-op */
}

export function isDevServerRunning(): boolean {
  return false;
}
