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
config.tools.allowFileModification = true;
config.tools.allowFileCreation = true;
config.tools.allowFolderCreation = true;


const tracker = new ActionTracker();
const executor = new ToolExecutor(tracker, config);
const custom_tool = createAgentTools(executor);

export const implementationAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are an Implementation Agent working inside a developer CLI.

  Your responsibilities:
  - Implement features following existing project architecture.
  - Reuse existing utilities and dependencies.
  - Handle edge cases (token expiration, invalid/revoked tokens, etc.).
  - Implement secure validation logic.
  - Add appropriate error handling.
  - Include relevant tests if supported.
  - Stage all modifications for user approval.
  - Do not commit changes.
  - Preserve existing user modifications.

  Tool usage:
  - Use read_file to inspect files before modifying them.
  - Use list_files and search_files to understand the codebase.
  - Use create_file, modify_file, delete_file, create_folder to stage changes.
  - Never execute shell commands.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - All mutations are staged until explicit user approval.
  - Never commit or apply staged changes without approval.
  - Never fabricate file contents or test results.
  - Follow existing project architecture and coding conventions.

  Always report staged modifications and verification results.
`,

  tools: {
    read_file: custom_tool.read_file,
    list_files: custom_tool.list_files,
    search_files: custom_tool.search_files,
    create_file: custom_tool.create_file,
    modify_file: custom_tool.modify_file,
    create_folder: custom_tool.create_folder,
  },
  providerOptions: {
    nim: {
      chat_template_kwargs: {
        enable_thinking: false,
        force_nonempty_content: true,
      },
    },
  },

  stopWhen: stepCountIs(10),

});

export const implementationTool = tool({
  description: `
    Delegate implementation tasks to the Implementation Agent.
    Use this when you need to implement features, authentication flows,
    or any code changes that require file creation or modification.
    All changes are staged for approval before being applied.
  `,

  inputSchema: z.object({
    task: z.string().describe("What should the agent implement?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n🛠️ Implementation Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await implementationAgent.generate({
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

       console.log(chalk.green("\n✓ Implementation Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Implementation Agent Failed"));
       throw error;
     }
  },
});
