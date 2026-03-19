/**
 * Structured project plan produced by the Planner agent.
 */
export interface ProjectPlan {
  framework: string;
  dependencies: string[];
  features: string[];
  pages: string[];
  components: string[];
  files: string[];
}

/**
 * A single generated file (path + content).
 */
export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Result of the full Plan → Generate → Review pipeline.
 */
export interface PipelineResult {
  status: "success" | "error";
  files_created: number;
  fixes_applied: number;
  files?: GeneratedFile[];
  error?: string;
  plan?: ProjectPlan;
}
