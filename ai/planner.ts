import type OpenAI from "openai";
import type { ProjectPlan } from "./types";

const PLANNER_SYSTEM = `You are a product and technical architect. Given a user's short product idea, output a structured project plan as JSON only.

Return exactly this shape (no other fields, no markdown):
{
  "framework": "React" | "Vite" | "Next.js" etc.,
  "dependencies": ["react", "react-dom", "tailwindcss", ...],
  "features": ["feature1", "feature2", ...],
  "pages": ["Home", ...],
  "components": ["Navbar", "Hero", "Features", "Showcase", "About", "Testimonials", "Pricing", "FAQ", "Contact", "Footer"],
  "files": ["src/App.tsx", "src/components/Navbar.tsx", "src/components/Hero.tsx", "src/components/Features.tsx", "src/components/Showcase.tsx", "src/components/About.tsx", "src/components/Testimonials.tsx", "src/components/Pricing.tsx", "src/components/FAQ.tsx", "src/components/Contact.tsx", "src/components/Footer.tsx", "src/components/ui/Button.tsx", "src/components/ui/Card.tsx", "src/components/ui/Container.tsx", "src/components/ui/Section.tsx", "src/index.css"]
}

For a SaaS landing page generator, always include the standard landing structure: Navbar, Hero, Features, Showcase, About, Testimonials, Pricing, FAQ, Contact, Footer, and ui primitives. Framework should be React with Vite. Dependencies should include react, react-dom, tailwindcss. Infer features and pages from the user prompt. Return ONLY valid JSON.`;

const DEFAULT_PLAN: ProjectPlan = {
  framework: "React",
  dependencies: ["react", "react-dom", "tailwindcss"],
  features: ["Landing page", "Responsive UI", "Modern SaaS design"],
  pages: ["Home"],
  components: [
    "Navbar",
    "Hero",
    "Features",
    "Showcase",
    "About",
    "Testimonials",
    "Pricing",
    "FAQ",
    "Contact",
    "Footer",
  ],
  files: [
    "src/App.tsx",
    "src/components/Navbar.tsx",
    "src/components/Hero.tsx",
    "src/components/Features.tsx",
    "src/components/Showcase.tsx",
    "src/components/About.tsx",
    "src/components/Testimonials.tsx",
    "src/components/Pricing.tsx",
    "src/components/FAQ.tsx",
    "src/components/Contact.tsx",
    "src/components/Footer.tsx",
    "src/components/ui/Button.tsx",
    "src/components/ui/Card.tsx",
    "src/components/ui/Container.tsx",
    "src/components/ui/Section.tsx",
    "src/index.css",
  ],
};

function parsePlan(raw: string): ProjectPlan | null {
  try {
    const cleaned = raw.replace(/^[\s\S]*?```(?:json)?\s*/i, "").replace(/```\s*$/g, "").trim();
    const start = cleaned.indexOf("{");
    if (start === -1) return null;
    const end = cleaned.lastIndexOf("}");
    if (end <= start) return null;
    const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
    return {
      framework: typeof parsed.framework === "string" ? parsed.framework : DEFAULT_PLAN.framework,
      dependencies: Array.isArray(parsed.dependencies) ? parsed.dependencies.filter((d): d is string => typeof d === "string") : DEFAULT_PLAN.dependencies,
      features: Array.isArray(parsed.features) ? parsed.features.filter((f): f is string => typeof f === "string") : DEFAULT_PLAN.features,
      pages: Array.isArray(parsed.pages) ? parsed.pages.filter((p): p is string => typeof p === "string") : DEFAULT_PLAN.pages,
      components: Array.isArray(parsed.components) ? parsed.components.filter((c): c is string => typeof c === "string") : DEFAULT_PLAN.components,
      files: Array.isArray(parsed.files) ? parsed.files.filter((f): f is string => typeof f === "string") : DEFAULT_PLAN.files,
    };
  } catch {
    return null;
  }
}

/**
 * Convert user prompt into a structured project plan.
 */
export async function plan(
  userPrompt: string,
  openai: OpenAI,
  log?: (msg: string) => void
): Promise<ProjectPlan> {
  console.log("[Planner] running");
  if (log) log("[Planner] Starting...");
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PLANNER_SYSTEM },
      { role: "user", content: `User product idea: ${userPrompt}\n\nReturn ONLY the JSON project plan.` },
    ],
    temperature: 0.3,
    max_tokens: 2000,
    response_format: { type: "json_object" },
  });
  const raw = completion.choices?.[0]?.message?.content ?? "";
  const result = parsePlan(raw);
  if (result) {
    if (log) log("[Planner Complete] Plan: " + result.files.length + " files, " + result.components.length + " components");
    return result;
  }
  if (log) log("[Planner] Parse failed, using default plan");
  return DEFAULT_PLAN;
}
