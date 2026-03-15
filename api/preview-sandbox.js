let previewFiles = [];

export default function handler(req, res) {
  if (req.method === "POST") {
    // Reset store so new project never shows old preview
    previewFiles = [];
    const incoming = req.body?.files;
    previewFiles = Array.isArray(incoming)
      ? incoming.map((f) => ({ path: f.path || "", content: f.content ?? "" }))
      : [];
    return res.status(200).json({ ok: true });
  }

  if (req.method === "GET") {
    return res.status(200).json({ files: previewFiles });
  }

  res.status(405).end();
}
