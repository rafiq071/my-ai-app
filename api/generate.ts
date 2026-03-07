import OpenAI from "openai";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SYSTEM_PROMPT = `You are generating a React 18 + TypeScript single-page app. Return ONLY valid JSON, no markdown.

Rules:
- Plain React 18 + TypeScript. No Next.js, no app/ or pages/ directory.
- Include: index.html (with <div id="root"></div>), src/main.tsx (createRoot from react-dom/client), src/App.tsx.
- In src/main.tsx: const rootElement = document.getElementById("root") || document.body; createRoot(rootElement).render(<App />);
- File paths: relative, no "..", no absolute paths.
- For landing pages: create a modern, attractive layout with a hero section, clear headings, and call-to-action. Use semantic HTML and inline styles or a simple CSS approach. Make it look professional and unique.
- For "SEO services" or marketing pages: include a hero, feature/benefit sections, and a clear CTA. Use a clean color scheme and good typography.

Schema:
{ "name": "string", "description": "string", "files": [ { "path": "string", "content": "string", "type": "file" } ] }`;

function extractJson(text: string): string {
  const t = (text || "").trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/) || [];
  return (m[1] || t).trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: true, message: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: true, message: "OPENAI_API_KEY not set" });
  }

  let body: { prompt?: string; projectId?: string; existingFiles?: { path: string; content: string }[] };
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
  } catch {
    return res.status(400).json({ error: true, message: "Invalid JSON body" });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return res.status(400).json({ error: true, message: "prompt is required" });
  }

  const existingFiles = Array.isArray(body.existingFiles) ? body.existingFiles : [];
  const context =
    existingFiles.length > 0
      ? `\n\nCurrent project files (for context only):\n${existingFiles
          .slice(0, 20)
          .map((f: any) => `--- ${f.path} ---\n${(f.content || "").slice(0, 500)}`)
          .join("\n")}`
      : "";

  try {
    const openai = new OpenAI({ apiKey });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt + context },
      ],
      temperature: 0.35,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const jsonStr = extractJson(raw);
    let parsed: any;
    try {
      parsed = JSON.parse(jsonStr);
    } catch {
      return res.status(500).json({
        error: true,
        message: "Model did not return valid JSON",
        raw: raw.slice(0, 500),
      });
    }

    const name = String(parsed.name || "app").trim();
    const description = typeof parsed.description === "string" ? parsed.description : prompt;
    const files = Array.isArray(parsed.files)
      ? parsed.files
          .filter((f: any) => f && typeof f.path === "string" && typeof f.content === "string")
          .map((f: any) => ({
            path: String(f.path).trim(),
            content: String(f.content),
            type: f.type === "directory" ? "directory" : "file",
          }))
      : [];

    if (files.length === 0) {
      return res.status(500).json({ error: true, message: "No valid files in response" });
    }

    return res.status(200).json({
      success: true,
      project: { name, description, files },
    });
  } catch (err) {
    console.error("Generate error:", err);
    const message = err instanceof Error ? err.message : "Generation failed";
    return res.status(500).json({ error: true, message });
  }
}
