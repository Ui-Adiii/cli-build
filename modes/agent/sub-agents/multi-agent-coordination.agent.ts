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

export const multiAgentCoordinationAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Multi-Agent Coordination Agent working inside a developer CLI.

  Your responsibilities:
  - Check available subagents and their capabilities.
  - Delegate relevant independent research tasks to subagents.
  - Collect and review findings from multiple subagents.
  - Identify architectural problems across agent results.
  - Prepare a unified implementation plan from coordinated findings.
  - Present recommendations with file references.
  - Avoid duplicate delegation.
  - The Main Developer Agent must review all subagent results.

  Tool usage:
  - Use list_files to discover project structure.
  - Use search_files to locate relevant code.
  - Use read_file to inspect actual file contents.
  - Never claim you cannot access the filesystem before attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never invent file contents.
  - Base all findings on actual inspected files.
  - Do not perform implementation yourself; only coordinate and plan.

  Always return coordinated findings and a unified plan with file references.
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

export const multiAgentCoordinationTool = tool({
  description: `
    Delegate multi-agent coordination tasks to the Multi-Agent Coordination Agent.
    Use this when you need to delegate research across multiple subagents,
    collect their findings, identify architectural problems, and prepare
    a unified implementation plan.
  `,

  inputSchema: z.object({
    task: z.string().describe("What coordination task should the agent perform?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n🤝 Multi-Agent Coordination Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await multiAgentCoordinationAgent.generate({
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

       console.log(chalk.green("\n✓ Multi-Agent Coordination Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Multi-Agent Coordination Agent Failed"));
       throw error;
     }
  },
});
