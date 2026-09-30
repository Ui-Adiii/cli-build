import {
  Output,
  extractJsonMiddleware,
  generateText,
  stepCountIs,
  tool,
  wrapLanguageModel,
} from "ai";
import { z } from "zod";
import chalk from "chalk";
import { getAgentModel } from "../../ai";
import { ActionTracker } from "../agent/action-tracker.ts";
import { ToolExecutor } from "../agent/tool-executor.ts";
import { defaultAgentConfig } from "../agent/types.ts";
import type { Plan, PlanStep } from "./types.ts";
import { createWebTools } from "./web-tools.ts";

const planSchema = z.object({
  researchSummary: z.string().optional(),
  steps: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        hints: z.array(z.string()).optional(),
        complexity: z.enum(["low", "medium", "high"]).optional(),
      }),
    )
    .min(1)
    .max(10), // Reduced from 15 to 10 for faster planning
});

function readOnlyTools(executor: ToolExecutor) {
  return {
    read_file: tool({
      description:
        "Read a text file from the workspace. Use a path relative to the project root.",
      inputSchema: z.object({
        path: z.string().describe("Relative file path"),
      }),
      execute: async ({ path: p }) => executor.readFile(p),
    }),

    list_files: tool({
      description: "List files and directories under a path.",
      inputSchema: z.object({
        path: z.string(),
        recursive: z.boolean().optional().default(false),
      }),
      execute: async ({ path: p, recursive }) =>
        executor.listFiles(p, recursive),
    }),

    search_files: tool({
      description:
        'Find files matching a glob pattern (e.g. "*.ts", "**/*.md"). Optional content substring filter.',
      inputSchema: z.object({
        root: z.string().describe("Directory to search, relative to root"),
        pattern: z
          .string()
          .describe("Glob-like pattern using * and ** (forward slashes)"),
        content_contains: z.string().optional(),
      }),
      execute: async ({ root, pattern, content_contains }) =>
        executor.searchFiles(root, pattern, content_contains),
    }),

    analyze_codebase: tool({
      description:
        "Summarize structure: file counts, size, extensions. Read-only.",
      inputSchema: z.object({
        path: z.string().default("."),
      }),
      execute: async ({ path: p }) => executor.analyzeCodebase(p),
    }),

    list_skills: tool({
      description:
        "List absolute paths to SKILL.md files under configured skill directories (Cursor / Claude).",
      inputSchema: z.object({}),
      execute: async () => executor.listSkills(),
    }),

    read_skill: tool({
      description:
        "Read a SKILL.md file. Path must be absolute and under skill roots, or use a path returned by list_skills.",
      inputSchema: z.object({
        path: z.string(),
      }),
      execute: async ({ path: p }) => executor.readSkill(p),
    }),
  };
}

const PLAN_INSTRUCTIONS = (codebase: string, hasWeb: boolean) =>
  [
    "You are a Plan-Mode planner.",
    "You DO NOT modify files.",
    `Workspace: ${codebase}`,

    "First, use the available read-only tools to research the workspace efficiently.",
    "Use codebase and skills tools when needed.",
    "Focus on gathering only essential information needed for the plan.",

    hasWeb
      ? "Web tools are available (web_search/web_crawl/fetch_url). Use them sparingly and only when critical."
      : "Web tools are unavailable (no FIRECRAWL_API_KEY).",

    "After completing your research, create a concise implementation plan.",

    "Return ONLY valid JSON.",
    "The response MUST use exactly this structure:",

    `{
  "researchSummary": "string",
  "steps": [
    {
      "title": "string",
      "description": "string",
      "hints": ["string"],
      "complexity": "low"
    }
  ]
}`,

    "IMPORTANT:",
    "- The top-level key MUST be `steps`.",
    "- `steps` MUST be an array of objects.",
    "- NEVER return steps as strings.",
    "- Every step MUST have `title` and `description`.",
    "- `hints` must be an array of strings when provided.",
    "- `complexity` must be `low`, `medium`, or `high` when provided.",
    "- Do NOT use a `plan` key.",
    "- Do NOT return tool calls in the final response.",
    "- Return 1–10 steps (optimized for speed).",
  ].join("\n");

export async function generatePlan(goal: string) {
  const config = defaultAgentConfig();
  const tracker = new ActionTracker();
  const executor = new ToolExecutor(tracker, config);

  const hasWeb = !!process.env.FIRECRAWL_API_KEY;
  const model = wrapLanguageModel({
    model: getAgentModel(true),
    middleware: extractJsonMiddleware(),
  });

  const tools = {
    ...readOnlyTools(executor),
    ...(hasWeb ? createWebTools(tracker) : {}),
  };

  console.log(chalk.cyan("\n🔍 Researching & drafting a plan (optimized)…\n"));

  // Reduced steps for faster planning (was 20)
  const result = await generateText({
    model,
    tools,
    stopWhen: stepCountIs(12), // Reduced from 20
    system: PLAN_INSTRUCTIONS(config.codebasePath, hasWeb),
    prompt: `User goal: \n${goal}`,
    output: Output.object({ schema: planSchema }),
  });

  const validated = planSchema.parse(result.output);

  const steps: PlanStep[] = validated.steps.map((s, i) => ({
    id: `step-${i + 1}`,
    title: s.title,
    description: s.description,
    hints: s.hints,
    complexity: s.complexity,
  }));

  return { goal, researchSummary: validated.researchSummary, steps };
}