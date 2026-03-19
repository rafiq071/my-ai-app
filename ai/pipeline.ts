import type OpenAI from "openai";
import type { PipelineResult, GeneratedFile } from "./types";
import { plan } from "./planner";
import { generate } from "./generator";
import { review } from "./reviewer";

export type { ProjectPlan, GeneratedFile, PipelineResult } from "./types";
export { plan } from "./planner";
export { generate } from "./generator";
export { review } from "./reviewer";

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
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: "error",
        error: msg || "Planner failed",
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
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: "error",
        error: msg || "Generator failed",
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
      const msg = err instanceof Error ? err.message : String(err);
      return {
        status: "error",
        error: msg || "Reviewer failed",
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
    const message = error instanceof Error ? error.message : String(error);
    return {
      status: "error",
      error: message || "Unknown pipeline failure",
      files_created: 0,
      fixes_applied: 0,
      files: [],
    };
  }
}
