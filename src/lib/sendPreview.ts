import type { RefObject } from "react";

export interface PreviewFile {
  path: string;
  content: string;
}

export function sendPreview(
  files: PreviewFile[],
  iframeRef: RefObject<HTMLIFrameElement>
): void {
  if (!iframeRef?.current?.contentWindow) return;
  iframeRef.current.contentWindow.postMessage(
    { type: "preview-files", files },
    "*"
  );
}
