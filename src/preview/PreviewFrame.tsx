import React from "react";
import type { RefObject } from "react";

export interface PreviewFrameProps {
  iframeRef: RefObject<HTMLIFrameElement>;
}

export default function PreviewFrame({ iframeRef }: PreviewFrameProps) {
  return (
    <iframe
      ref={iframeRef}
      src="/preview-runtime.html"
      title="Preview"
      className="w-full h-full border-0"
      style={{ minHeight: "380px", display: "block", borderRadius: "8px", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
    />
  );
}
