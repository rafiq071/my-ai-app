/**
 * Local dev server for /api/generate so "Generate" works without Vercel.
 * Run: npm run dev (runs both Vite and this) or npm run dev:api in a separate terminal.
 * Set OPENAI_API_KEY in .env for AI generation.
 */
import http from "http";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from several possible locations so it always finds the key
const envPaths = [
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, ".env"),
];
let loadedFrom = null;
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    if (result.parsed && result.parsed.OPENAI_API_KEY) {
      loadedFrom = envPath;
      break;
    }
  }
}

// Fallback: read OPENAI_API_KEY directly from .env if still missing (handles encoding/format issues)
if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_API_KEY.trim()) {
  for (const envPath of envPaths) {
    try {
      const raw = fs.readFileSync(envPath, "utf8");
      const match = raw.match(/OPENAI_API_KEY\s*=\s*(.+)/);
      if (match) {
        const value = match[1]
          .replace(/\s*#.*$/, "")
          .replace(/^["']|["']$/g, "")
          .replace(/\r/g, "")
          .trim();
        if (value) {
          process.env.OPENAI_API_KEY = value;
          loadedFrom = envPath;
          break;
        }
      }
    } catch (_) {}
  }
}

// Trim in case .env has trailing space, BOM, or Windows CR
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY || "").replace(/\r/g, "").trim();
if (OPENAI_API_KEY) process.env.OPENAI_API_KEY = OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.warn(
    "\n⚠ OPENAI_API_KEY is not set. Add it to a .env file in the project root, e.g:\n   OPENAI_API_KEY=sk-your-key-here\n   Get a key from https://platform.openai.com/api-keys\n   Then restart the server. Generate will work after that.\n"
  );
} else {
  const prefix = OPENAI_API_KEY.slice(0, 15) + (OPENAI_API_KEY.length > 15 ? "..." : "");
  console.log("OPENAI_API_KEY loaded. Key prefix:", prefix);
  if (loadedFrom) console.log("  .env from:", loadedFrom);
}

const PLAN_PROMPT = `You are a product designer. Given a user request for a website, output a JSON plan only. No markdown.

Schema (return exactly this JSON shape):
{
  "pages": ["Home"],
  "components": ["Navbar", "Hero", "Features", "Showcase", "About", "Testimonials", "Pricing", "FAQ", "Contact", "Footer"],
  "design": {
    "framework": "React",
    "styling": "TailwindCSS",
    "ui": "modern SaaS"
  }
}

Include all section components: Navbar, Hero, Features, Showcase, About, Testimonials, Pricing, FAQ, Contact, Footer. Return ONLY valid JSON.`;

const TEMPLATE_HINT = `
Convert a SHORT PRODUCT IDEA into a complete production-quality SaaS landing page. Examples: "AI SaaS for marketing automation", "Fitness coaching app", "Crypto portfolio tracker", "AI legal document generator". Infer the full product. Design quality must match Stripe, Linear, Vercel, Notion, Framer, Raycast — the page must look like a real startup website. STEP 1: Internally design (product positioning, hero messaging, key features, pricing, testimonials style, visual design system with typography hierarchy, spacing, cards, buttons). STEP 2: Generate with React + TypeScript + Tailwind only; no inline styles. Use the exact spacing and component specs; semantic HTML; accessibility; responsive grids; output only JSON.
`;

const SYSTEM_PROMPT = `You are a world-class product designer and senior React + Tailwind engineer. Your task is to convert a SHORT PRODUCT IDEA into a complete, production-quality SaaS landing page.

The user may give a simple prompt such as: "AI SaaS for marketing automation" | "Fitness coaching app" | "Crypto portfolio tracker" | "AI legal document generator". You must infer the full product and generate a beautiful modern landing page. Design quality must match: Stripe, Linear, Vercel, Notion, Framer, Raycast. The page must look like a real startup website.

------------------------------------------------
STEP 1 — DESIGN PLAN (apply internally before writing code)

Before writing code, design the page with:
• Define the product positioning
• Define hero messaging
• Define key product features
• Define pricing positioning
• Define testimonials style
• Define visual design system

Design system must include:

Typography hierarchy: Hero → Section titles → Body → Caption

Spacing system: Hero py-20 md:py-28 | Sections py-16 md:py-24 | Container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

Card system: rounded-xl, shadow-lg, hover:shadow-xl, hover:-translate-y-1, transition

Buttons — Primary: bg-gradient-to-r from-indigo-600 to-violet-600, text-white, hover:shadow-lg. Secondary: border border-gray-300, hover:bg-gray-50.

Visual style: Gradient hero; modern SaaS layout; glass / soft shadows; icons for features; responsive grids; smooth hover states.

------------------------------------------------
STEP 2 — GENERATE THE WEBSITE

After designing internally, generate the landing page using React + TypeScript + Tailwind. NO inline styles. Tailwind utility classes only.

------------------------------------------------
REQUIRED FILE STRUCTURE

Return code for: src/App.tsx | src/components/Navbar.tsx, Hero.tsx, Features.tsx, Showcase.tsx, About.tsx, Testimonials.tsx, Pricing.tsx, FAQ.tsx, Contact.tsx, Footer.tsx | src/components/ui/Button.tsx, Card.tsx, Container.tsx, Section.tsx | src/index.css

------------------------------------------------
PAGE STRUCTURE

Navbar | Hero (headline, supporting text, primary CTA, secondary CTA, hero illustration or UI mock) | Features (6 cards, icon + title + description) | Product Showcase (alternating image + text rows) | About (company/product explanation, trust badges or stats) | Testimonials (3–6: avatar, name, role, quote) | Pricing (3 tiers: Starter | Pro MOST POPULAR | Enterprise — Pro must have badge "Most Popular", larger shadow, slight scale) | FAQ (accordion: aria-expanded, aria-controls, keyboard accessible) | Contact (form: name, email, message with labels; also email, phone, location) | Footer (logo, product links, company links, social: Twitter, GitHub, LinkedIn with aria-label; current year)

------------------------------------------------
ACCESSIBILITY

Semantic HTML: header, nav, main, section, article, footer. Images must include alt text. Forms must include labels. FAQ must support keyboard navigation.

------------------------------------------------
RESPONSIVE

Mobile first. Use sm:, md:, lg:. Grids must adapt to mobile.

------------------------------------------------
OUTPUT FORMAT

Return ONLY valid JSON. Do NOT include explanations. No markdown.

Preferred: { "src/App.tsx": "...", "src/components/Navbar.tsx": "...", ... }

Alternative: { "files": [ { "path": "src/App.tsx", "content": "..." }, ... ] }

Return only the code files. Every section must have visual UI. Nav links must work: <a href="#features"> etc. and matching section id="features".

------------------------------------------------

NAVBAR — WORKING LINKS (CRITICAL)

All navigation links and the header CTA MUST work. Use anchor links that scroll to sections.

• Nav links: Use <a href="#features">Features</a>, <a href="#showcase">Product</a>, <a href="#about">About</a>, <a href="#pricing">Pricing</a>, <a href="#faq">FAQ</a>, <a href="#contact">Contact</a>. Do NOT use <button> for nav items or empty href="#".
• Header CTA button: Use <a href="#contact">Get Started</a> or <a href="#pricing">View Pricing</a> (real link that scrolls). Never a button with no onClick/href.
• Every section wrapper MUST have the matching id: <section id="features">, <section id="showcase">, <section id="about">, <section id="pricing">, <section id="faq">, <section id="contact">. Add these ids to the outer element of each section.
• When mapping over children or any array prop (e.g. in Card, feature lists), always guard: use (children || []).map(...) or (items || []).map(...) so the preview never hits "Cannot read properties of undefined (reading 'map')".

------------------------------------------------

CORE RULES

• React functional components only
• Always export default App
• TailwindCSS only
• No inline styles
• No plain HTML layouts
• Fully responsive
• Modular components
• Production-ready UI

------------------------------------------------

DESIGN SYSTEM — PREMIUM LOOK (NO PLAIN BLACK ON WHITE)

Avoid flat black text on pure white. Use a premium, modern palette:

• Page background: soft gradient or tint — e.g. bg-gradient-to-b from-slate-50 to-white or bg-gray-50. Never plain white for full page.
• Headlines: text-slate-900 or text-gray-900 (not pure black). Hero can use white text if hero has a dark/gradient background.
• Body text: text-slate-600 or text-gray-600.
• Accent: use a primary color for CTAs and links — e.g. bg-indigo-600 hover:bg-indigo-700, or gradient bg-gradient-to-r from-indigo-600 to-violet-600. Buttons should stand out.
• Navbar: bg-white/90 backdrop-blur border-b border-gray-200, or dark nav with bg-slate-900 text-white.
• Hero: either (a) light — bg-gradient-to-br from-indigo-50/30 to-white, headline text-slate-900, or (b) dark — bg-gradient-to-br from-slate-900 to-slate-800, headline text-white, subtext text-slate-300.
• Cards: bg-white with border border-gray-200 shadow-lg shadow-gray-200/50 rounded-2xl. Use subtle shadows so sections have depth.
• Section spacing: py-16 md:py-24. Container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8.

------------------------------------------------

UI PRIMITIVES

src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Container.tsx
src/components/ui/Section.tsx

Button: Primary — rounded-xl px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-lg shadow-indigo-200 transition. Secondary — rounded-xl px-6 py-3 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition.

Cards: rounded-2xl border border-gray-200 p-6 bg-white shadow-lg shadow-gray-200/50 transition hover:shadow-xl. Feature cards: same with hover:-translate-y-1.

------------------------------------------------

MANDATORY PAGE COMPONENTS

src/components/Navbar.tsx
src/components/Hero.tsx
src/components/Features.tsx
src/components/Showcase.tsx
src/components/About.tsx
src/components/Testimonials.tsx
src/components/Pricing.tsx
src/components/FAQ.tsx
src/components/Contact.tsx
src/components/Footer.tsx
src/components/ui/Button.tsx
src/components/ui/Card.tsx
src/components/ui/Container.tsx
src/components/ui/Section.tsx

------------------------------------------------

PAGE STRUCTURE (order; each section must have id for nav links)

Navbar (logo, <a href="#features"> etc., <a href="#contact"> CTA)
Hero (id="hero", gradient, headline, 2 CTAs, hero illustration/mock)
Features (id="features") — 6 cards
Showcase (id="showcase") — alternating image+text
About (id="about")
Testimonials
Pricing (id="pricing") — 3 tiers, Pro "Most Popular"
FAQ (id="faq") — accordion, aria-expanded/aria-controls
Contact (id="contact") — form + company info
Footer (logo, links, social with aria-label, copyright year)

------------------------------------------------

HERO SECTION (VERY IMPORTANT)

Layout

grid grid-cols-1 lg:grid-cols-2 gap-12 items-center

Left side: small badge, large headline, supporting text, two CTA buttons. Both buttons MUST be working links: primary <a href="#contact">Get Started</a> (or #pricing), secondary <a href="#features">Learn More</a>. Do not use <button> without href for CTAs.

Right side MUST contain a SaaS UI preview. Do NOT use empty grey boxes. IMAGES: If you use an <img> tag, the src MUST be a full, working URL that returns a real image. Use ONLY these or equivalent working URLs: https://picsum.photos/600/400 (generic), https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop (team/business), https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop (analytics). Do NOT use relative paths (e.g. /image.png) or placeholder URLs that 404 — they will show a broken image. PREFERRED: Avoid img for hero and use a rich mock instead: a div with bg-gradient-to-br from-indigo-100 to-violet-100 rounded-2xl p-6 containing labels ("Revenue", "Growth"), numbers ("$12.4k", "+24%"), and small colored bars (divs with bg-indigo-500 h-8 rounded, varying widths). That way nothing can break and the design stays high quality.

------------------------------------------------

FEATURES SECTION

6 feature cards. NEVER use placeholder text like "Feature 1", "Feature 2", or "Description for feature 1".

Layout:

grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8

Each card: a unique inline SVG icon (or emoji that fits the feature), a REAL title and 1–2 sentence description that match the user's product. Example: for "Guest Posting" use titles like "High-DA Placements", "Niche-Relevant Outreach", "Custom Reporting" with specific benefit copy. Cards must use hover lift animation.

------------------------------------------------

SHOWCASE SECTION

Alternating layout sections. Left text / right UI mock, then reverse.

grid grid-cols-1 lg:grid-cols-2 gap-12 items-center

The UI side must NOT be empty grey rectangles. Use real-looking content: section labels ("Revenue", "Visits"), fake numbers (e.g. "$12,450", "2,340"), progress bars (a div with width and bg color), or a topic-relevant image (e.g. <img src="https://images.unsplash.com/..." className="rounded-xl w-full object-cover" alt="" />). Build mini analytics panels, small tables with row text, or dashboard cards with numbers so the right side looks like a real product screenshot.

------------------------------------------------

PRICING SECTION

3 pricing cards. NEVER use "Feature 1", "Feature 2", "Feature 3" as list items.

grid grid-cols-1 md:grid-cols-3 gap-8

Middle card must be highlighted: scale-105 border-2 border-black shadow-xl

Each card: plan name, price, and a REAL feature list that matches the product (e.g. "10 guest posts/month", "Priority support", "Custom reports", "Dedicated manager"). Write 4–6 specific bullets per plan. CTA button per card.

------------------------------------------------

TESTIMONIALS

3 testimonial cards. NEVER use "Client 1", "Company 1", or "Testimonial from client 1".

Each card: avatar (use <img src="https://i.pravatar.cc/100?u=1" alt="" className="rounded-full w-12 h-12" /> and vary u=1, u=2, u=3 for each card, OR use initials in a colored circle e.g. "SC" for Sarah Chen), a realistic fake name (e.g. Sarah Chen, Marcus Webb, Priya Patel), a company/role (e.g. "Head of Marketing, TechFlow"), and a short specific quote that sounds real (e.g. "We doubled our backlinks in 3 months."). Layout: grid md:grid-cols-3 gap-8.

------------------------------------------------

ABOUT US SECTION (MANDATORY — ATTRACTIVE)

Section with id="about". Headline "About Us" or "Who We Are". MUST include at least one high-quality photo: <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Team" className="rounded-2xl w-full object-cover shadow-xl" /> in a two-column layout. Other side: mission headline, 2–3 paragraphs, value badges (rounded-xl bg-indigo-50 text-indigo-700). Optional: stats overlay (e.g. "10+ Years" "500+ Clients"). Use bg-gradient-to-b from-slate-50 to-white. No placeholder text.

------------------------------------------------

FAQ SECTION (MANDATORY — ACCESSIBLE ACCORDION)

Section with id="faq". Headline "Frequently Asked Questions". 5–8 Q&A pairs. Use useState accordion. Each item: button or heading with aria-expanded, aria-controls pointing to answer id; answer with matching id for aria-controls. Keyboard accessible (Enter/Space to toggle). Rounded-2xl border bg-white shadow-sm; border-l-4 border-indigo-500 when open. Max-w-4xl mx-auto. End with "Can't find an answer? <a href="#contact">Contact us</a>." No placeholder questions.

------------------------------------------------

CONTACT SECTION (MANDATORY)

Section with id="contact". Headline "Contact Us" or "Get in Touch". MUST include: (1) Contact form with <label htmlFor="..."> for name, email, message; (2) Company info: email (mailto:), phone (tel:), location/address. Use <form>, <input>, <textarea> with labels. Submit use e.preventDefault() to avoid reload. Clean card layout, good spacing.

------------------------------------------------

FOOTER

Logo, product links, company links, social icons (Twitter/X, GitHub, LinkedIn — each <a aria-label="Twitter"> etc.). Copyright: © {new Date().getFullYear()}. 3–4 columns: Product, Company, Resources or Legal.

------------------------------------------------

CONTENT RULES — NO PLACEHOLDERS

• All copy must be specific to the user's product/topic. Infer from the prompt (e.g. "Guest Posting" → guest posting, SEO, backlinks, content).
• FORBIDDEN: "Feature 1/2/3", "Description for feature X", "Client 1/2/3", "Company 1/2/3", "Testimonial from client X", or any generic placeholder text.
• Features: 6 real titles and descriptions. Pricing: real feature bullets per plan. Testimonials: real-sounding names, companies, and quotes.
• Hero/Showcase right side: never leave empty grey boxes. Prefer a gradient + dashboard mock (labels, numbers, colored bars) so no image can break. If you use <img>, src MUST be a full working URL (e.g. https://picsum.photos/600/400 or https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop). Never use relative paths or fake URLs — they show a broken image icon.

------------------------------------------------

PROMPT EXPANSION

If the user prompt is short, expand it automatically into a full SaaS startup landing page with rich UI sections.

Never generate minimal layouts.

------------------------------------------------

OUTPUT FORMAT

CRITICAL: Your response must be ONLY the JSON object. No markdown, no code fences, no explanation before or after. Start your response with { and end with }. Return STRICT JSON only.

{
 "files":[
  { "path":"src/App.tsx","content":"..." },
  { "path":"src/components/Navbar.tsx","content":"..." },
  { "path":"src/components/Hero.tsx","content":"..." },
  { "path":"src/components/Features.tsx","content":"..." },
  { "path":"src/components/Showcase.tsx","content":"..." },
  { "path":"src/components/About.tsx","content":"..." },
  { "path":"src/components/Testimonials.tsx","content":"..." },
  { "path":"src/components/Pricing.tsx","content":"..." },
  { "path":"src/components/FAQ.tsx","content":"..." },
  { "path":"src/components/Contact.tsx","content":"..." },
  { "path":"src/components/Footer.tsx","content":"..." },
  { "path":"src/components/ui/Button.tsx","content":"..." },
  { "path":"src/components/ui/Card.tsx","content":"..." },
  { "path":"src/components/ui/Container.tsx","content":"..." },
  { "path":"src/components/ui/Section.tsx","content":"..." },
  { "path":"src/index.css","content":"..." }
 ]
}

Never output text outside JSON.
Escape quotes and newlines (\\n, \\").
Response must start with { and end with }.`;

const SYSTEM_PROMPT_LEGACY = `You are an expert product designer and copywriter. Generate HIGH-QUALITY, conversion-optimized landing pages at the level of Stripe, Linear, Vercel, and Notion. Every pixel and word should feel intentional and professional.

OUTPUT: Valid JSON only. No markdown. Return exactly ONE file: src/App.tsx.
Schema: { "name": "string", "description": "string", "files": [ { "path": "src/App.tsx", "content": "string" } ] }
REQUIRED: The "files" array MUST contain exactly one file with path "src/App.tsx". Never omit it.
Return ONLY valid JSON. Do not include explanations or markdown.

CRITICAL: Put ALL UI in a single App.tsx file. Do NOT use import from "./components/..." or any other file. Do NOT create separate component files. Inline everything inside one export default function App() { return (...); }. Single file only.

Use React + inline styles only (style={{ ... }}). No Tailwind, no CSS files. Escape JSON (newlines as \\n, quotes as \\").

——— SECTIONS (include all, in this order) ———
1. NAVBAR — Sticky top. Logo/product name (bold, 1.25rem). Nav links: Features, Pricing, (About/Contact if relevant). One primary CTA button (gradient). Max-width container (e.g. 1200px), padding 1rem 2rem. Subtle borderBottom or boxShadow on scroll feel. fontFamily: "'Inter', system-ui, sans-serif".
2. HERO — Full-width section. Headline: 2.75rem–3.5rem, fontWeight 800, letterSpacing "-0.04em", lineHeight 1.1. Subheadline: 1.25rem, color #64748b, maxWidth 32rem, margin "0 auto". Two buttons: primary (gradient, 1rem padding) and secondary (outline). Optional: "Trusted by X+ companies" or logo strip. Background: soft gradient (e.g. radial at top) or #fafafa. padding 4rem 2rem.
3. FEATURES — Section title "Why [product]" or "Everything you need", 2rem font. Grid of 6 cards: 3 columns, gap 2rem. Each card: rounded 16px, padding 1.5rem, boxShadow "0 4px 24px rgba(0,0,0,0.06)", border "1px solid #f1f5f9". Icon/emoji in a 48px rounded box with light background. Title (1.125rem, fontWeight 600). Description 1–2 sentences, color #64748b. Use a consistent accent (e.g. #6366f1).
4. TESTIMONIALS — "Loved by teams everywhere" or similar. 3 testimonial cards. Quote text (1.125rem, fontStyle italic or normal). Author: name (fontWeight 600), role, company. Optional: avatar circle with initial. Cards with subtle border or shadow.
5. HOW IT WORKS / PROBLEM–SOLUTION — Two columns or 3 steps. Clear headings. Short paragraphs. Optional illustration placeholder (rounded box with emoji or "Step 1"). Spacing 2rem between steps.
6. PRICING — "Simple, transparent pricing". 3 tiers in a row. One tier has badge "Most Popular". Each: tier name, price (e.g. "$X/mo"), 4–6 feature bullets (checkmark or dot), one CTA button. Cards: rounded 16px, border, the popular one with borderColor accent or subtle background. gap 1.5rem.
7. FAQ — "Frequently asked questions". 5–7 Q&A pairs. Each: question (fontWeight 600, 1rem), answer (color #64748b, marginTop 0.5rem). Stack vertically with padding 1rem 0, borderBottom "1px solid #f1f5f9". Address real objections (pricing, security, integration).
8. FINAL CTA — Dark background (#0f172a or gradient). Headline (2rem), subtext, single CTA button (bright or white). padding 4rem 2rem, textAlign center.
9. FOOTER — background #f8fafc, borderTop "1px solid #e2e8f0". Links in rows: Product (Features, Pricing), Company (About, Blog), Legal (Privacy, Terms). Copyright line. padding 2rem, fontSize 0.875rem, color #64748b.

——— DESIGN & QUALITY RULES ———
- Typography: Use a clear hierarchy. Headlines 2rem+, subheads 1.25rem, body 1rem, small 0.875rem. fontWeight 800 for main headlines, 600 for section titles, 400/500 for body.
- Colors: Primary #6366f1, primary-dark #4f46e5. Neutrals: #0f172a (dark text), #334155 (secondary), #64748b (muted), #f1f5f9 (light bg), #e2e8f0 (borders). Gradients: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) for primary buttons and hero accents.
- Spacing: Consistent padding (2rem, 4rem for sections). gap 1.5rem–2rem in grids. maxWidth 72rem or 80rem for content containers, margin "0 auto".
- Buttons: Primary rounded 10–12px, padding 0.75rem 1.5rem, fontWeight 600. Hover optional (slightly darker or scale 1.02).
- Copy: Write SPECIFIC, benefit-driven copy. No "Lorem ipsum". No generic "We help businesses grow." Use concrete value: "Ship features 2x faster", "Trusted by 10,000+ developers". Headlines should state outcome or differentiation. CTAs: "Get started free", "Start building", "Try for free".
- Responsive: Use maxWidth, flexWrap, and percentage or rem so layout doesn’t break on small screens. Avoid fixed pixel widths for main content.
- Polish: Rounded corners 12–16px. Soft shadows (0 4px 24px rgba(0,0,0,0.06)). No harsh borders. Consistent 1px solid #e2e8f0 or #f1f5f9 for dividers.

Export default function App() with everything inlined.`;

const MODIFY_SYSTEM_PROMPT = `You MODIFY existing React/TSX code to fulfill the user's instruction. Do NOT regenerate the whole page. Change ONLY what is needed. Preserve the existing design system (colors, spacing, typography) unless the user asks to change it.

Rules:
- Keep ALL UI in a single App.tsx. No new component files. No imports from "./components/...".
- Use inline styles only. No Tailwind, no CSS files.
- Preserve structure: same sections and order unless the user asks to add/remove/reorder.
- When adding sections (e.g. testimonials, pricing), match the existing style: same palette (#6366f1, #64748b, etc.), same border-radius (12–16px), same shadow and spacing.
- Copy: keep tone professional and benefit-driven. No lorem ipsum.

Examples of instructions:
- "Change hero color to purple" → Update gradient/background and primary color in hero only.
- "Add testimonials section" → Insert a testimonials block (3 quotes, name/role/company) between two existing sections.
- "Make pricing cards larger" → Increase padding/fontSize on pricing cards.
- "Add a dark mode toggle" → Add state and a toggle that switches background/text colors.

OUTPUT: Valid JSON. Schema: { "name": "string", "description": "string", "files": [ { "path": "src/App.tsx", "content": "string" } ] }
Include the FULL content of the modified App.tsx. Escape JSON (\\n, \\").
Return ONLY valid JSON. No markdown, no explanations.`;

function extractJson(text) {
  const t = (text || "").trim();
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/) || [];
  return (m[1] || t).trim();
}

/** Extract first balanced { ... } from string. */
function extractBalancedJson(str) {
  const start = str.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  let quote = "";
  for (let i = start; i < str.length; i++) {
    const c = str[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === quote) inString = false;
      continue;
    }
    if (c === '"' || c === "'") {
      inString = true;
      quote = c;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return str.slice(start, i + 1);
    }
  }
  return null;
}

/** Strip markdown code fences from file content (AI sometimes embeds ```tsx in the string). */
function stripMarkdownFromCode(content) {
  let s = String(content || "").trim();
  const tsxMatch = s.match(/^```(?:tsx|jsx|ts|js)?\s*([\s\S]*?)```\s*$/);
  if (tsxMatch && tsxMatch[1]) return tsxMatch[1].trim();
  const anyMatch = s.match(/^```\s*([\s\S]*?)```\s*$/);
  if (anyMatch && anyMatch[1]) return anyMatch[1].trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:tsx|jsx|ts|js)?\s*/i, "").replace(/```\s*$/, "").trim();
  }
  return s;
}

/** Safety parser: strip code fences, trim, extract JSON. */
function parseJsonFromAI(raw) {
  let text = String(raw || "");
  let cleaned = text
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/```\s*$/g, "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  console.log("AI raw response:", cleaned.slice(0, 2000) + (cleaned.length > 2000 ? "..." : ""));
  const toTry = [
    cleaned,
    extractJson(text),
    extractBalancedJson(text),
    extractBalancedJson(cleaned),
  ].filter(Boolean);
  for (const s of toTry) {
    const trimmed = String(s).trim();
    if (!trimmed.startsWith("{")) continue;
    try {
      return { ok: true, parsed: JSON.parse(trimmed) };
    } catch (_) {}
  }
  const fallback = extractBalancedJson(cleaned) || extractBalancedJson(text);
  if (fallback) {
    try {
      return { ok: true, parsed: JSON.parse(fallback) };
    } catch (_) {}
  }
  return { ok: false };
}

const DEFAULT_APP_TSX = `export default function App() {
  return (
    <div style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome</h1>
      <p>Your app is loading. Edit this file to get started.</p>
    </div>
  );
}
`;

function normalizeToFilesArray(parsed) {
  if (!parsed || typeof parsed !== "object") return [];
  if (Array.isArray(parsed.files)) {
    return parsed.files
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
    .map(([path, content]) => ({ path: String(path).trim(), content: String(content) }));
  return flat.length > 0 ? flat : [];
}

function hasAppTsx(parsed) {
  if (parsed && typeof parsed["src/App.tsx"] === "string") return true;
  const files = parsed && parsed.files;
  if (!Array.isArray(files)) return false;
  return files.some((f) => f && (f.path === "src/App.tsx" || f.path === "App.tsx"));
}

function ensureAppTsxInFiles(allFiles) {
  const has = allFiles.some((f) => f && (f.path === "src/App.tsx" || f.path === "App.tsx"));
  if (has) return allFiles;
  return [{ path: "src/App.tsx", content: DEFAULT_APP_TSX, type: "file" }, ...allFiles];
}

/** Default About Us section — injected when AI omits or stubs it */
const DEFAULT_ABOUT_TSX = `import React from "react";
export default function About() {
  return (
    <section id="about" className="py-24 px-6 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" alt="Our team" className="rounded-2xl w-full object-cover shadow-xl" />
            <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white shadow-xl border border-slate-100 px-6 py-4 flex gap-8">
              <div><div className="text-2xl font-bold text-indigo-600">10+</div><div className="text-sm text-slate-600">Years</div></div>
              <div><div className="text-2xl font-bold text-indigo-600">500+</div><div className="text-sm text-slate-600">Clients</div></div>
            </div>
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">About Us</h2>
            <p className="text-lg text-slate-600 max-w-xl mb-4">We help businesses grow with modern tools and expert support. Our mission is to deliver real value through quality products and outstanding service.</p>
            <p className="text-lg text-slate-600 max-w-xl mb-8">Founded with a focus on simplicity and results, we work with teams of all sizes to achieve their goals. Get in touch to learn how we can help you.</p>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 font-semibold text-sm">Quality first</span>
              <span className="px-4 py-2 rounded-xl bg-violet-50 text-violet-700 font-semibold text-sm">Customer focused</span>
              <span className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-semibold text-sm">Results driven</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}`;

/** Default Our Team section — injected when AI omits or stubs it */
const DEFAULT_TEAM_TSX = `import React from "react";
const team = [
  { name: "Sarah Chen", role: "CEO & Co-founder", bio: "Former VP at a Fortune 500. Passionate about building products that scale.", img: "https://i.pravatar.cc/160?u=sarah" },
  { name: "Marcus Webb", role: "CTO", bio: "Ex-Google engineer. Loves clean architecture and developer experience.", img: "https://i.pravatar.cc/160?u=marcus" },
  { name: "Priya Patel", role: "Head of Product", bio: "Product leader with 12 years in SaaS. User obsession is the north star.", img: "https://i.pravatar.cc/160?u=priya" },
  { name: "Alex Rivera", role: "Head of Design", bio: "Design systems and brand. Making complex products feel simple.", img: "https://i.pravatar.cc/160?u=alex" },
];
export default function Team() {
  return (
    <section id="team" className="py-24 px-6 bg-white">
      <div className="max-w-6xl mx-auto text-center mb-14">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Our Team</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">The people behind the product. We're here to help you succeed.</p>
      </div>
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {team.map((member, i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
            <img src={member.img} alt={member.name} className="rounded-full w-20 h-20 mx-auto mb-4 object-cover ring-4 ring-slate-100" />
            <h3 className="font-bold text-slate-900 text-lg">{member.name}</h3>
            <p className="text-indigo-600 font-medium text-sm mb-2">{member.role}</p>
            <p className="text-slate-600 text-sm">{member.bio}</p>
          </div>
        ))}
      </div>
    </section>
  );
}`;

/** Default FAQ section — advanced accordion design */
const DEFAULT_FAQ_TSX = \`import React, { useState } from "react";
export default function FAQ() {
  const [open, setOpen] = useState(null);
  const items = [
    { q: "How do I get started?", a: "Sign up for a free account, describe your project, and our AI will generate a first version in minutes. You can edit and deploy from there." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards and PayPal. Invoicing is available for Team and Enterprise plans." },
    { q: "Can I cancel anytime?", a: "Yes. You can cancel your subscription at any time. You will keep access until the end of your billing period." },
    { q: "Do you offer support?", a: "Free tier includes community support. Pro and Team plans include priority email support and optional onboarding calls." },
    { q: "Is my data secure?", a: "Yes. We use industry-standard encryption and do not share your data with third parties. You can export or delete your data anytime." },
  ];
  return (
    <section id="faq" className="py-24 px-6 bg-gradient-to-b from-white to-slate-50/50">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Frequently Asked Questions</h2>
        <p className="text-slate-600 mb-10">Everything you need to know.</p>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className={\\\`rounded-2xl border overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow \\\${open === i ? "border-l-4 border-l-indigo-500 border-slate-200" : "border-slate-200"}\\\`}>
              <button type="button" onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <span className="font-semibold text-slate-900">{item.q}</span>
                <span className="text-xl text-indigo-500 flex-shrink-0 font-light">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && <div className="px-5 pb-5 pt-0 text-slate-600 leading-relaxed border-t border-slate-100">{item.a}</div>}
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-slate-600">Can't find an answer? <a href="#contact" className="text-indigo-600 font-semibold hover:underline">Contact us</a>.</p>
      </div>
    </section>
  );
}\`;

/** Default Contact section with form — injected when AI omits or stubs it */
const DEFAULT_CONTACT_TSX = `import React from "react";
export default function Contact() {
  return (
    <section id="contact" className="py-24 px-6 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Contact Us</h2>
            <p className="text-lg text-slate-600 mb-8">Have a question or want to get started? Send us a message and we'll get back to you quickly.</p>
            <div className="space-y-4">
              <a href="mailto:support@example.com" className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-colors">
                <span className="text-2xl">✉</span>
                <div><div className="text-sm text-slate-500">Email</div><div className="font-medium text-slate-900">support@example.com</div></div>
              </a>
            </div>
          </div>
          <div className="p-8 rounded-2xl border border-slate-200 bg-white shadow-lg">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Send a message</h3>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input type="text" placeholder="Your name" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input type="email" placeholder="you@example.com" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
                <textarea rows={4} placeholder="How can we help?" className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" />
              </div>
              <button type="submit" className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">Send message</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}`;

function isStubContent(content, minLen = 400) {
  const s = String(content || "").trim();
  return s.length < minLen || !s.includes("id=") || /placeholder|TODO|coming soon/i.test(s);
}

/** Ensure About, Team, FAQ, Contact exist and are rendered in App. Injects defaults when missing. */
function ensureAboutFaqContact(allFiles, appContent) {
  let files = [...allFiles];
  const hasAbout = files.some((f) => f.path === "src/components/About.tsx");
  const aboutFile = files.find((f) => f.path === "src/components/About.tsx");
  const hasFaq = files.some((f) => f.path === "src/components/FAQ.tsx");
  const faqFile = files.find((f) => f.path === "src/components/FAQ.tsx");
  const hasContact = files.some((f) => f.path === "src/components/Contact.tsx");
  const contactFile = files.find((f) => f.path === "src/components/Contact.tsx");

  if (!hasAbout || (aboutFile && isStubContent(aboutFile.content))) {
    files = files.filter((f) => f.path !== "src/components/About.tsx");
    files.push({ path: "src/components/About.tsx", content: DEFAULT_ABOUT_TSX, type: "file" });
  }
  if (!hasFaq || (faqFile && isStubContent(faqFile.content))) {
    files = files.filter((f) => f.path !== "src/components/FAQ.tsx");
    files.push({ path: "src/components/FAQ.tsx", content: DEFAULT_FAQ_TSX, type: "file" });
  }
  if (!hasContact || (contactFile && isStubContent(contactFile.content))) {
    files = files.filter((f) => f.path !== "src/components/Contact.tsx");
    files.push({ path: "src/components/Contact.tsx", content: DEFAULT_CONTACT_TSX, type: "file" });
  }

  let out = String(appContent || "");
  if (!out.includes("<About") && !out.includes("<About />")) {
    out = out.replace(/(<\/Testimonials>)/, "$1\n      <About />");
    if (!out.includes("<About")) out = out.replace(/(<Testimonials\s*\/>)/, "$1\n      <About />");
  }
  if (!out.includes("<FAQ") && !out.includes("<FAQ />")) {
    out = out.replace(/(<About\s*\/>)/, "$1\n      <FAQ />");
    if (!out.includes("<FAQ")) out = out.replace(/(<\/About>)/, "$1\n      <FAQ />");
  }
  if (!out.includes("<Contact") && !out.includes("<Contact />")) {
    out = out.replace(/(<Footer)/, "<Contact />\n      $1");
    if (!out.includes("<Contact")) out = out.replace(/(<\/FAQ>)/, "$1\n      <Contact />");
  }
  return { files, appContent: out };
}

/** Strip ./components/ imports and replace component tags so preview works with single-file mount. */
function sanitizeAppTsx(content) {
  let out = String(content || "");
  out = out.replace(/^\s*import\s+[\s\S]*?\s+from\s+['"]\.\.?\/components\/[^'"]+['"]\s*;?\s*$/gm, "");
  const componentNames = [
    "Pricing", "FAQ", "ContactForm", "FinalCTA", "Footer", "Hero", "Navbar",
    "Features", "Testimonials", "ProblemSolution", "CtaSection", "ContactSection", "About", "Team", "Contact", "Showcase",
  ];
  for (const name of componentNames) {
    const openClose = new RegExp(`<${name}[^>]*>[\\s\\S]*?<\\/${name}>`, "g");
    const open = new RegExp(`<${name}\\s*/?>`, "g");
    out = out.replace(openClose, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`);
    out = out.replace(open, `<div key="${name}" style={{ minHeight: 24, margin: '8px 0' }} />`);
  }
  return out;
}

/** Stage 3: Auto-fix generated files — ensure export default, add React imports, remove invalid imports. */
function autoFixGeneratedFiles(files) {
  const reactImport = "import React from \"react\";\nimport { useState, useEffect, useRef, useMemo, useCallback } from \"react\";\n";
  return files.map((f) => {
    let content = String(f.content || "").trim();
    const path = f.path === "App.tsx" ? "src/App.tsx" : f.path;
    const isTsx = path.endsWith(".tsx") || path.endsWith(".jsx");
    if (!isTsx) return { ...f, path, content };
    if (!content.includes("export default")) {
      content = content.replace(/\bexport\s+(function|const)\s+(\w+)\s*\(/g, "export default function $2(");
      if (!content.includes("export default")) content = content.replace(/^(function\s+\w+)\s*\(/m, "export default $1(");
    }
    if (!content.includes("from \"react\"") && !content.includes("from 'react'")) {
      const hasHooks = /\b(useState|useEffect|useRef|useMemo|useCallback)\s*\(/.test(content);
      if (hasHooks) content = reactImport + content;
      else content = "import React from \"react\";\n" + content;
    }
    content = content.replace(/import\s+type\s+[^;]+;/g, "");
    content = content.replace(/import\s+[^;]*from\s+['\"][^'\"]*['\"]\s*;?\s*$/gm, (line) => {
      if (/from\s+['\"]react['\"]/.test(line)) return line;
      if (/from\s+['\"]\.\.?\//.test(line)) return line;
      return "";
    });
    content = content.replace(/import\s+[\s\S]*?from\s+['\"]lucide-react['\"]\s*;?/g, "");
    return { ...f, path, content };
  });
}

// Fixed base template paths — never regenerated. Only src/App.tsx is replaced by AI.
// package.json is read from base-template/package.json (static). No Tailwind.
const BASE_TEMPLATE_PATHS = [
  "index.html",
  "src/main.tsx",
  "vite.config.ts",
  "tsconfig.json",
  "package.json",
];

const BASE_TEMPLATE_DIR = path.join(__dirname, "base-template");

function readBaseTemplate() {
  const files = [];
  for (const filePath of BASE_TEMPLATE_PATHS) {
    const isFromTemplateDir = filePath === "package.json" || filePath === "vite.config.ts";
    const fullPath = isFromTemplateDir
      ? path.join(BASE_TEMPLATE_DIR, filePath)
      : path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) continue;
    try {
      const content = fs.readFileSync(fullPath, "utf8");
      files.push({
        path: filePath,
        content,
        type: "file",
      });
    } catch (_) {}
  }
  return files;
}

async function handleGenerate(body) {
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) throw new Error("prompt is required");
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set. Add OPENAI_API_KEY=sk-... to a .env file in the project root and restart the server. Get a key from https://platform.openai.com/api-keys");

  console.log("[AI] Generate request, modify:", !!body.modify);

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    organization: process.env.OPENAI_ORG_ID || undefined,
    project: process.env.OPENAI_PROJECT_ID || undefined,
  });

  const existingFiles = Array.isArray(body.existingFiles) ? body.existingFiles : [];
  const isModify = body.modify === true;

  if (isModify) {
    const appFile = existingFiles.find((f) => f.path === "src/App.tsx" || f.path === "App.tsx");
    if (!appFile || typeof appFile.content !== "string") {
      throw new Error("Modify mode requires existing src/App.tsx content. Open a project with a generated landing page first.");
    }
    const userMessage = `User instruction: ${prompt}\n\nExisting src/App.tsx:\n\`\`\`tsx\n${appFile.content}\n\`\`\`\n\nReturn the full updated App.tsx as JSON in the "files" array. Only include the modified src/App.tsx.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: MODIFY_SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 0.2,
      max_tokens: 8000,
    });

    const text =
      completion.output_text ??
      completion.output?.[0]?.content?.[0]?.text ??
      completion.choices?.[0]?.message?.content ??
      "";
    let parseResult = parseJsonFromAI(String(text));
    if (!parseResult.ok) {
      const repairCompletion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: MODIFY_SYSTEM_PROMPT },
          { role: "user", content: "Return ONLY valid JSON, no markdown. Previous response was invalid. Try again:\n\n" + userMessage },
        ],
        temperature: 0.2,
        max_tokens: 8000,
      });
      const retryText =
        repairCompletion.output_text ??
        repairCompletion.output?.[0]?.content?.[0]?.text ??
        repairCompletion.choices?.[0]?.message?.content ??
        "";
      parseResult = parseJsonFromAI(String(retryText));
    }
    if (!parseResult.ok) {
      throw new Error("AI generation failed. Retrying...");
    }
    const parsed = parseResult.parsed;
    const files = Array.isArray(parsed.files)
      ? parsed.files
          .filter((f) => f && (f.path === "src/App.tsx" || f.path === "App.tsx") && typeof f.content === "string")
          .map((f) => ({
            path: "src/App.tsx",
            content: String(f.content),
            type: "file",
          }))
      : [];
    if (files.length === 0) throw new Error("No updated App.tsx in response");
    let appContent = String(files[0].content);
    appContent = stripMarkdownFromCode(appContent);
    const baseFiles = readBaseTemplate();
    const mergedFiles = [
      ...baseFiles,
      { path: "src/App.tsx", content: appContent, type: "file" },
    ];
    console.log("[AI] Modify success");
    return {
      success: true,
      project: {
        name: String(parsed.name || "app").trim(),
        description: typeof parsed.description === "string" ? parsed.description : prompt,
        files: mergedFiles,
      },
    };
  }

  console.log("[AI] New generation, prompt length:", prompt.length);

  const context =
    existingFiles.length > 0
      ? "\n\nCurrent project files (for context only):\n" +
        existingFiles
          .slice(0, 20)
          .map((f) => `--- ${f.path} ---\n${(f.content || "").slice(0, 500)}`)
          .join("\n")
      : "";

  let planJson = null;
  try {
    const planCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: PLAN_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 800,
    });
    const planText = planCompletion.choices?.[0]?.message?.content ?? "";
    const planResult = parseJsonFromAI(planText);
    if (planResult.ok && planResult.parsed) planJson = planResult.parsed;
  } catch (e) {
    console.log("[AI] Plan stage skipped:", e?.message || e);
  }

  const userMessageForGenerate = planJson
    ? `Plan: ${JSON.stringify(planJson)}\n\nUser request: ${prompt}${context}`
    : prompt + context;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: TEMPLATE_HINT },
      { role: "user", content: userMessageForGenerate },
    ],
    temperature: 0.7,
    max_tokens: 16000,
  });

  const text =
    completion.output_text ??
    completion.output?.[0]?.content?.[0]?.text ??
    completion.choices?.[0]?.message?.content ??
    "";

  const raw = String(text);
  let parseResult = parseJsonFromAI(raw);
  if (!parseResult.ok) {
    const repairCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: TEMPLATE_HINT },
        { role: "user", content: "Return ONLY valid JSON. Do not include explanations or markdown. Previous response was invalid. Try again:\n\n" + prompt + context },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    });
    const retryText =
      repairCompletion.output_text ??
      repairCompletion.output?.[0]?.content?.[0]?.text ??
      repairCompletion.choices?.[0]?.message?.content ??
      "";
    parseResult = parseJsonFromAI(String(retryText));
  }
  if (!parseResult.ok) {
    throw new Error("AI generation failed. Retrying...");
  }
  const parsed = parseResult.parsed;

  const name = String(parsed.name || "app").trim();
  const description = typeof parsed.description === "string" ? parsed.description : prompt;
  let allFiles = normalizeToFilesArray(parsed);

  if (!hasAppTsx(parsed) && !allFiles.some((f) => f.path === "src/App.tsx" || f.path === "App.tsx")) {
    const appTsxRetryPrompt = "You must include src/App.tsx in the response. Return valid JSON only. No markdown.\n\nOriginal prompt: " + prompt + context;
    const repairCompletion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "system", content: TEMPLATE_HINT },
        { role: "user", content: appTsxRetryPrompt },
      ],
      temperature: 0.3,
      max_tokens: 6000,
    });
    const retryText =
      repairCompletion.output_text ??
      repairCompletion.output?.[0]?.content?.[0]?.text ??
      repairCompletion.choices?.[0]?.message?.content ??
      "";
    const retryResult = parseJsonFromAI(String(retryText));
    if (retryResult.ok && retryResult.parsed) {
      allFiles = normalizeToFilesArray(retryResult.parsed);
    }
  }

  allFiles = ensureAppTsxInFiles(allFiles);
  allFiles = autoFixGeneratedFiles(allFiles);

  let appFile = allFiles.find(
    (f) => f.path === "src/App.tsx" || f.path === "App.tsx"
  );
  if (!appFile || typeof appFile.content !== "string") {
    throw new Error("No src/App.tsx in response.");
  }

  const { files: filesWithAboutFaqContact, appContent: appContentWithSections } = ensureAboutFaqContact(allFiles, appFile.content);
  allFiles = filesWithAboutFaqContact;
  appFile = { ...appFile, content: appContentWithSections };

  const hasComponents = allFiles.some((f) => f.path && f.path.startsWith("src/components/"));
  const sanitizedAppContent = hasComponents ? appFile.content : sanitizeAppTsx(appFile.content);

  const baseFiles = readBaseTemplate();
  const basePaths = new Set(baseFiles.map((f) => f.path));
  const aiOverrides = new Map(allFiles.map((f) => {
    const path = f.path === "App.tsx" ? "src/App.tsx" : f.path;
    const content = (path === "src/App.tsx" ? sanitizedAppContent : String(f.content));
    return [path, { path, content, type: "file" }];
  }));
  const merged = baseFiles.map((f) => {
    const over = aiOverrides.get(f.path);
    return over ? { path: f.path, content: over.content, type: "file" } : f;
  });
  const extra = allFiles
    .filter((f) => {
      const p = f.path === "App.tsx" ? "src/App.tsx" : f.path;
      return !basePaths.has(p) && p.startsWith("src/");
    })
    .map((f) => {
      const p = f.path === "App.tsx" ? "src/App.tsx" : f.path;
      const content = p === "src/App.tsx" ? sanitizedAppContent : String(f.content);
      return { path: p, content, type: "file" };
    });
  const files = [...merged, ...extra];

  console.log("[AI] Generation success, files:", files.map((f) => f.path).join(", "));
  return { success: true, project: { name, description, files } };
}

const PORT = Number(process.env.API_PORT) || 3001;

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== "POST" || req.url !== "/api/generate") {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: true, message: "Not Found" }));
    return;
  }

  let body = "";
  for await (const chunk of req) body += chunk;
  let parsed;
  try {
    parsed = JSON.parse(body || "{}");
  } catch {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: true, message: "Invalid JSON body" }));
    return;
  }

  try {
    const result = await handleGenerate(parsed);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(result));
  } catch (err) {
    console.error("[AI] Generate error:", err?.message || err);
    let message = "Generation failed";
    if (err instanceof Error && err.message) {
      message = err.message;
    } else if (err && typeof err === "object") {
      const o = err;
      if (typeof o.message === "string" && o.message) message = o.message;
      else if (o.error && typeof o.error === "object" && typeof o.error.message === "string" && o.error.message)
        message = o.error.message;
    }
    if (message === "Generation failed" && err != null) {
      const s = String(err);
      if (s && s !== "[object Object]") message = s;
    }
    const is401 = err?.status === 401 || String(message).includes("401");
    const isInvalidKey =
      err?.code === "invalid_api_key" ||
      /invalid|incorrect.*api key/i.test(String(message));
    if (is401 || isInvalidKey) {
      message =
        "OpenAI rejected the API key. Try: 1) Create a new key at https://platform.openai.com/account/api-keys (Create new secret key). 2) If you use a project key (sk-proj-...), add OPENAI_ORG_ID and OPENAI_PROJECT_ID to .env (find them in your project’s Settings in the OpenAI dashboard). 3) Put the key in .env as OPENAI_API_KEY=sk-... with no quotes. 4) Restart the server (npm run dev).";
    } else if (message.includes("Internal server error")) {
      message = "OpenAI API is temporarily unavailable. Try again in a moment.";
    } else if (message.includes("429") || message.includes("rate limit")) {
      message = "Rate limit exceeded. Wait a moment and try again.";
    }
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ success: false, error: message }));
  }
});

server.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}/api/generate`);
  if (!OPENAI_API_KEY) console.warn("Generate requests will fail until OPENAI_API_KEY is set in .env");
});
