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

export const bugInvestigationAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Bug Investigation Agent working inside a developer CLI.

  Your responsibilities:
  - Inspect relevant source files for potential bugs.
  - Identify possible runtime errors.
  - Check edge cases and error handling.
  - Identify performance issues.
  - Explain the root cause of confirmed issues.
  - Distinguish confirmed bugs from potential issues.
  - Provide file paths and relevant code references.

  Tool usage:
  - Use list_files to discover relevant source files.
  - Use search_files to locate suspicious code patterns.
  - Use read_file to inspect actual file contents.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never invent file contents or bugs.
  - Base all findings on actual inspected files.
  - Clearly distinguish confirmed bugs from potential issues.

  Always return findings with file paths and code references.
`,

  tools: {
    read_file: custom_tool.read_file,
    list_files: custom_tool.list_files,
    search_files: custom_tool.search_files,
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

export const bugInvestigationTool = tool({
  description: `
    Delegate bug investigation tasks to the Bug Investigation Agent.
    Use this when you need to find runtime errors, edge cases,
    performance issues, or root causes in the source code.
  `,

  inputSchema: z.object({
    task: z.string().describe("What should the agent investigate for bugs?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n🐛 Bug Investigation Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await bugInvestigationAgent.generate({
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

       console.log(chalk.green("\n✓ Bug Investigation Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Bug Investigation Agent Failed"));
       throw error;
     }
  },
});
