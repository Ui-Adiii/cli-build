import { ToolLoopAgent, stepCountIs } from "ai";
import { tool } from "ai";
import { z } from "zod";

import { getAgentModel } from "../../../ai/ai.config";
import { defaultAgentConfig } from "../types";
import { ActionTracker } from "../action-tracker";
import { ToolExecutor } from "../tool-executor";
import { createAgentTools } from "../agent-tools";
import chalk from "chalk";


const config = defaultAgentConfig();

config.tools.allowShellExecution = false;
config.tools.allowFileModification = false;
config.tools.allowFileCreation = false;
config.tools.allowFolderCreation = false;


const tracker = new ActionTracker();
const executor = new ToolExecutor(tracker, config);
const custom_tool = createAgentTools(executor);

export const planningAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Planning Specialist working inside a developer CLI.

  Your responsibilities:
  - Analyze the existing architecture.
  - Create implementation plans for new features.
  - Identify required changes and files that need modification.
  - Plan database changes when applicable.
  - Plan API and middleware changes.
  - Define testing strategies.
  - Identify potential risks.
  - Provide clear step-by-step plans.

  Tool usage:
  - Use list_files to discover project files.
  - Use search_files to locate relevant code.
  - Use read_file to inspect actual file contents.
  - Use analyze_codebase to get structural summaries.
  - Never claim you cannot access the filesystem before
    attempting to use your available tools.

  Restrictions:
  - Do not implement anything.
  - Do not modify files.
  - Never invent file contents.
  - Provide a clear step-by-step plan.

  Always return findings and recommendations.
`,

  tools: {
    read_file: custom_tool.read_file,
    list_files: custom_tool.list_files,
    search_files: custom_tool.search_files,
    analyze_codebase: custom_tool.analyze_codebase,
  },
  providerOptions: {
    nim: {
      chat_template_kwargs: {
        enable_thinking: false,
        force_nonempty_content: true,
      },
    },
  },

  stopWhen: stepCountIs(8),

});

export const planningTool = tool({
  description: `
    Delegate planning tasks to the planning agent.
    Use this when you need an implementation plan for a new feature,
    including architecture analysis, file changes, and risk assessment.
  `,

  inputSchema: z.object({
    task: z.string().describe("What should the agent plan?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n📋 Planning Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await planningAgent.generate({
         prompt: task,
         abortSignal,
         onStepFinish: ({ toolCalls }) => {
           for (const tc of toolCalls) {
             const preview = JSON.stringify(tc.input).slice(0, 160);
             console.log(
               chalk.green("  ✓"),
               chalk.yellow(String(tc.toolName)),
               chalk.dim(preview + (preview.length >= 160 ? "..." : "")),
             );
           }
         },
       });

       console.log(chalk.green("\n✓ Planning Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Planning Agent Failed"));
       throw error;
     }
  },
});
