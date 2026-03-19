import type OpenAI from "openai";
import type { ProjectPlan, GeneratedFile } from "./types";

const GENERATOR_SYSTEM = `You are a world-class product designer and senior React + Tailwind engineer. You generate production-quality SaaS landing pages.

Given a structured project plan and the user's product idea, generate the full source code for every file in plan.files.

RULES:
- React + TypeScript + Tailwind only. No inline styles.
- Use the exact design system: container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8; section py-16 md:py-24; hero py-20 md:py-28; cards rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition; primary button bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:shadow-lg; secondary border border-gray-300 hover:bg-gray-50.
- Every section: Navbar, Hero, Features, Showcase, About, Testimonials, Pricing (3 tiers, Pro "Most Popular"), FAQ (accordion, aria-expanded/aria-controls), Contact (form with labels + company info), Footer (social aria-label, current year).
- Use semantic HTML and accessibility (alt, labels, keyboard FAQ).
- Ensure correct imports: each component imports from "react"; App imports all section components from relative paths.
- Return ONLY valid JSON. No markdown. No explanations.

OUTPUT FORMAT (choose one, no other keys at top level):

Preferred — flat object, file path as key, content as string:
{ "src/App.tsx": "full file content...", "src/components/Navbar.tsx": "...", ... }

Alternative — files array:
{ "files": [ { "path": "src/App.tsx", "content": "..." }, ... ] }`;

function normalizeToFiles(parsed: Record<string, unknown>, plan: ProjectPlan): GeneratedFile[] {
  if (Array.isArray(parsed.files)) {
    return (parsed.files as { path?: string; content?: string }[])
      .filter((f) => f && typeof f.path === "string" && typeof f.content === "string")
      .map((f) => ({ path: String(f.path).trim(), content: String(f.content) }));
  }
  const flat = Object.entries(parsed)
    .filter(
      ([k, v]) =>
        typeof v === "string" &&
        k.length > 0 &&
        (k.includes("/") || k.endsWith(".tsx") || k.endsWith(".ts") || k.endsWith(".css") || k.endsWith(".jsx"))
    )
    .map(([path, content]) => ({ path: path.trim(), content: String(content) }));
  if (flat.length > 0) return flat;
  return [];
}

/**
 * Generate project files from the planner output.
 */
export async function generate(
  userPrompt: string,
  projectPlan: ProjectPlan,
  openai: OpenAI,
  log?: (msg: string) => void
): Promise<GeneratedFile[]> {
  console.log("[Generator] running");
  if (log) log("[Generator] Starting...");
  const planSummary = JSON.stringify({
    framework: projectPlan.framework,
    features: projectPlan.features,
    pages: projectPlan.pages,
    components: projectPlan.components,
    files: projectPlan.files,
  });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: GENERATOR_SYSTEM },
      {
        role: "user",
        content: `User product idea: ${userPrompt}\n\nProject plan:\n${planSummary}\n\nGenerate the complete code for every file listed in plan.files. Return ONLY the JSON object with file path keys and content strings (or "files" array). No markdown, no explanations.`,
      },
    ],
    temperature: 0.6,
    max_tokens: 16000,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices?.[0]?.message?.content ?? "";
  let files: GeneratedFile[] = [];
  try {
    const cleaned = raw.replace(/^[\s\S]*?```(?:json)?\s*/i, "").replace(/```\s*$/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    files = normalizeToFiles(parsed, projectPlan);
  } catch {
    console.warn("[Generator] JSON parse failed");
    if (log) log("[Generator] JSON parse failed");
    return [];
  }
  if (log) log("[Files Generated] " + files.length + " files");
  return files;
}
