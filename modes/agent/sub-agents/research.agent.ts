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

export const researchAgent = new ToolLoopAgent({
  model: getAgentModel(),

  instructions: `
  You are a Research Specialist working inside a developer CLI.

  Your responsibilities:
  - Explore the existing project.
  - Read README.md and other relevant files when requested.
  - Search source code using search_files.
  - Understand project architecture and dependencies.
  - Provide evidence-based findings with file paths.

  Tool usage:
  - Use list_files to discover project files.
  - Use search_files to locate relevant code.
  - Use read_file to inspect actual file contents.
  - Never claim you cannot access the filesystem before
    attempting to use your available tools.

  Restrictions:
  - Never modify or create files.
  - Never execute shell commands.
  - Never invent file contents.

  Always return findings and recommendations.
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



export const researchTool = tool({
  description: `
    Delegate technical research tasks to the research agent.
    Use this when you need documentation, investigation,
    technical comparisons or implementation research.
  `,

  inputSchema: z.object({
    task: z.string().describe("What should the agent research?"),
  }),

  execute: async ({ task }, { abortSignal }) => {
     console.log(chalk.cyan("\n🔍 Research Agent Activated"));
     console.log(chalk.dim(`Task: ${task}\n`));

     try {
       const result = await researchAgent.generate({
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
       

       console.log(chalk.green("\n✓ Research Agent Completed"));

       return result.text;
     } catch (error) {
       console.log(chalk.red("\n✗ Research Agent Failed"));
       throw error;
     }
  },
});
