# AI 3-Agent Pipeline

Plan → Generate → Review pipeline for the landing page generator.

## Architecture

```
User Prompt
    → planner()   → structured project plan (framework, dependencies, features, pages, components, files)
    → generator() → project files (path + content)
    → reviewer()   → fixes (imports, exports, syntax)
    → PipelineResult { status, files_created, fixes_applied, files }
```

## Modules

| File | Role |
|------|------|
| **planner.ts** | Converts user prompt into a structured JSON plan: framework, dependencies, features, pages, components, files |
| **generator.ts** | Takes plan + prompt, calls the model to generate all file contents; returns array of `{ path, content }` |
| **reviewer.ts** | Rule-based fixes: ensure React import, export default, remove invalid imports; optional missing-import injection for App.tsx |
| **pipeline.ts** | Runs `plan()` → `generate()` → `review()`, logs each step, returns `{ status, files_created, fixes_applied, files }` |

## Logging

Each step logs via the provided `log` callback:

- `[Planner Complete]` — plan with file count
- `[Files Generated]` — number of files
- `[Review Fixes Applied]` — rule-based fix count
- `[Pipeline] Complete. files_created=X, fixes_applied=Y`

## Usage

```ts
import OpenAI from "openai";
import { runPipeline } from "./ai/pipeline";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const result = await runPipeline("AI SaaS for marketing automation", openai, console.log);

if (result.status === "success" && result.files?.length) {
  console.log(result.files_created, result.fixes_applied);
  // use result.files
}
```

## Pipeline result shape

```ts
{
  status: "success" | "error",
  files_created: number,
  fixes_applied: number,
  files?: { path: string; content: string }[],
  error?: string,
  plan?: ProjectPlan
}
```
