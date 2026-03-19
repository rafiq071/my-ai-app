import type OpenAI from "openai";
import type { PipelineResult, GeneratedFile } from "./types";
import { plan } from "./planner";
import { generate } from "./generator";
import { review } from "./reviewer";

export type { ProjectPlan, GeneratedFile, PipelineResult } from "./types";
export { plan } from "./planner";
export { generate } from "./generator";
export { review } from "./reviewer";

/** Extract a string from any thrown value (including OpenAI APIError). */
function getErrorMessage(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message) return o.message;
    const inner = o.error;
    if (inner && typeof inner === "object" && typeof (inner as Record<string, unknown>).message === "string") {
      const msg = (inner as Record<string, unknown>).message as string;
      if (msg) return msg;
    }
  }
  const s = String(err);
  if (s && s !== "[object Object]") return s;
  return "Unknown error";
}

/**
 * Run the full Plan → Generate → Review pipeline.
 * Every step wrapped in try/catch; errors logged and returned with a clear reason.
 */
export async function runPipeline(
  prompt: string,
  openai: OpenAI,
  log: (msg: string) => void = console.log
): Promise<PipelineResult> {
  try {
    log("[Pipeline] Starting");

    let projectPlan;
    try {
      projectPlan = await plan(prompt, openai, log);
    } catch (err) {
      console.error("[Pipeline Error] Planner failed", err);
      const msg = getErrorMessage(err) || "Planner failed";
      return {
        status: "error",
        error: msg,
        files_created: 0,
        fixes_applied: 0,
        files: [],
      };
    }
    log(`[Planner Complete] ${projectPlan.files.length} files`);

    let generatedFiles: GeneratedFile[];
    try {
      generatedFiles = await generate(prompt, projectPlan, openai, log);
    } catch (err) {
      console.error("[Pipeline Error] Generator failed", err);
      const msg = getErrorMessage(err) || "Generator failed";
      return {
        status: "error",
        error: msg,
        files_created: 0,
        fixes_applied: 0,
        files: [],
      };
    }
    log(`[Files Generated] ${generatedFiles.length}`);

    let reviewed: { files: GeneratedFile[]; fixesApplied: number };
    try {
      reviewed = await review(generatedFiles, openai, log);
    } catch (err) {
      console.error("[Pipeline Error] Reviewer failed", err);
      const msg = getErrorMessage(err) || "Reviewer failed";
      return {
        status: "error",
        error: msg,
        files_created: generatedFiles.length,
        fixes_applied: 0,
        files: generatedFiles,
      };
    }
    log(`[Reviewer] Complete. Fixes: ${reviewed.fixesApplied}`);

    return {
      status: "success",
      files_created: reviewed.files.length,
      fixes_applied: reviewed.fixesApplied,
      files: reviewed.files,
    };
  } catch (error) {
    console.error("[Pipeline Error]", error);
    const message = getErrorMessage(error) || "Unknown pipeline failure";
    return {
      status: "error",
      error: message,
      files_created: 0,
      fixes_applied: 0,
      files: [],
    };
  }
}
