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

export const codebaseAnalysisAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Codebase Analysis Agent working inside a developer CLI.

  Your responsibilities:
  - Analyze the existing codebase structure.
  - Understand overall project architecture.
  - Map folder and file structure.
  - Identify main modules and their responsibilities.
  - Trace how different modules interact.
  - List important dependencies.
  - Provide evidence-based findings with actual file paths.

  Tool usage:
  - Use list_files to discover project files and folders.
  - Use search_files to locate relevant code patterns.
  - Use read_file to inspect actual file contents.
  - Use analyze_codebase to get structural summaries.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never invent file contents or architecture details.
  - Base all findings on actual inspected files.

  Always return findings and recommendations with file path references.
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

export const codebaseAnalysisTool = tool({
  description: `
    Delegate codebase analysis tasks to the Codebase Analysis Agent.
    Use this when you need to understand project architecture,
    folder structure, modules, dependencies, or module interactions.
  `,

  inputSchema: z.object({
    task: z.string().describe("What should the agent analyze in the codebase?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n📊 Codebase Analysis Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await codebaseAnalysisAgent.generate({
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

       console.log(chalk.green("\n✓ Codebase Analysis Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Codebase Analysis Agent Failed"));
       throw error;
     }
  },
});
