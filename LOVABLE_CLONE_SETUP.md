# Lovable Clone — What’s Included and What’s Required

## What’s in the repo

- **Auth**: Supabase sign up / sign in / session; RLS on `projects` and `project_files`.
- **Projects**: Create project, list by user, open workspace.
- **Workspace**:
  - **Files panel**: Load `project_files` from Supabase, list by path, select file, “+ New file”.
  - **Editor**: Textarea for selected file content; Save upserts into `project_files`.
  - **AI**: Textarea + “Generate” button; calls `POST /api/generate` with `{ prompt, projectId, existingFiles }`; response files are upserted into `project_files` and list refetched.
  - **Preview**: Placeholder (“Deploy your project to see a live preview”).
- **API**: `api/generate.ts` (Vercel serverless) — uses `OPENAI_API_KEY`, returns `{ project: { name, description, files } }`.

## What you need to do

1. **Supabase**
   - Run `supabase/schema.sql` in the Supabase SQL Editor (creates `profiles`, `projects`, `project_files`, `deployments`, RLS, trigger to create profile on signup).
   - Ensure `projects.user_id` is the auth user id (schema uses `profiles(id)` and the trigger sets `profiles.id = auth.users.id`).

2. **Env**
   - Copy `.env.example` to `.env` and set:
     - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
     - For Vercel: also set `OPENAI_API_KEY` (and optionally `VITE_API_URL` if the frontend calls another origin).

3. **Install and run**
   - `npm install`
   - `npm run dev` — Vite app only; `/api/generate` is not run locally unless you use `vercel dev` or another proxy.

4. **Deploy (Vercel)**
   - Connect repo; set env vars (Supabase + `OPENAI_API_KEY`).
   - Build uses `npm run build`; output is `dist`. `/api/*` is served as serverless functions.

## What’s still optional / future

- **Live preview**: In-browser runner (e.g. esbuild-wasm + iframe) or “Deploy to see preview”.
- **Monaco editor**: Replace textarea with `@monaco-editor/react` for syntax highlighting.
- **Deploy button**: Wire to Vercel (or similar) to deploy the current project and show URL.
