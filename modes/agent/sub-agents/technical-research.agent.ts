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

export const technicalResearchAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Technical Research Agent working inside a developer CLI.

  Your responsibilities:
  - Inspect existing architecture for integration points.
  - Evaluate compatible libraries and tools.
  - Explain implementation approaches for technical solutions.
  - Identify potential trade-offs of different approaches.
  - Provide practical, evidence-based recommendations.
  - Do not install dependencies or modify files.

  Tool usage:
  - Use list_files to discover project structure.
  - Use search_files to locate relevant code.
  - Use read_file to inspect actual file contents.
  - Use analyze_codebase to understand structural context.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never install dependencies.
  - Never invent file contents.
  - Base all findings on actual inspected files.

  Always return practical recommendations with trade-off analysis.
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

export const technicalResearchTool = tool({
  description: `
    Delegate technical research tasks to the Technical Research Agent.
    Use this when you need library evaluation, integration point analysis,
    implementation approach recommendations, or trade-off identification.
  `,

  inputSchema: z.object({
    task: z.string().describe("What technical research should the agent perform?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n🔬 Technical Research Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await technicalResearchAgent.generate({
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

       console.log(chalk.green("\n✓ Technical Research Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Technical Research Agent Failed"));
       throw error;
     }
  },
});
