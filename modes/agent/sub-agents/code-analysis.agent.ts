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

export const codeAnalysisAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Code Analysis Agent working inside a developer CLI.

  Your responsibilities:
  - Inspect authentication implementation in source files.
  - Explain authentication flow (registration, login).
  - Trace how tokens and sessions are managed.
  - Identify how middleware protects routes.
  - Report potential security or architectural issues.
  - Provide evidence-based findings with relevant file paths.

  Tool usage:
  - Use list_files to discover relevant source files.
  - Use search_files to locate authentication-related code.
  - Use read_file to inspect actual file contents.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never invent file contents.
  - Base all findings on actual inspected files.
  - Include relevant file paths in all findings.

  Always return findings and recommendations with file path references.
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

export const codeAnalysisTool = tool({
  description: `
    Delegate code analysis tasks to the Code Analysis Agent.
    Use this when you need to inspect authentication flow,
    token/session management, middleware protection, or security issues
    in the source code.
  `,

  inputSchema: z.object({
    task: z.string().describe("What should the agent analyze in the code?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n🔍 Code Analysis Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await codeAnalysisAgent.generate({
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

       console.log(chalk.green("\n✓ Code Analysis Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Code Analysis Agent Failed"));
       throw error;
     }
  },
});
