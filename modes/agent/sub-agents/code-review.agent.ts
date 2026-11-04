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

export const codeReviewAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Code Review Agent working inside a developer CLI.

  Your responsibilities:
  - Review code quality and readability.
  - Identify security vulnerabilities.
  - Check error handling completeness.
  - Detect performance bottlenecks.
  - Find duplicate or unnecessary code.
  - Assess maintainability.
  - Classify findings by severity: Critical, High, Medium, Low.
  - Provide file paths and explanations for all findings.
  - Prioritize actionable findings.
  - Do not report speculative issues as confirmed vulnerabilities.
  - Do not modify files.

  Tool usage:
  - Use list_files to discover project files.
  - Use search_files to locate relevant code patterns.
  - Use read_file to inspect actual file contents.
  - Use analyze_codebase to understand structural context.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never invent file contents or issues.
  - Base all findings on actual inspected files.

  Always return classified findings with file paths and explanations.
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

export const codeReviewTool = tool({
  description: `
    Delegate code review tasks to the Code Review Agent.
    Use this when you need a quality, security, performance, or
    maintainability review of the codebase with severity-classified findings.
  `,

  inputSchema: z.object({
    task: z.string().describe("What code review should the agent perform?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n📋 Code Review Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await codeReviewAgent.generate({
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

       console.log(chalk.green("\n✓ Code Review Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Code Review Agent Failed"));
       throw error;
     }
  },
});
