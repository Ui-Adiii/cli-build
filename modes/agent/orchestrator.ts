import { isCancel, text } from "@clack/prompts";
import chalk from "chalk";
import { defaultAgentConfig } from "./types";
import { ActionTracker } from "./action-tracker";
import { ToolExecutor } from "./tool-executor";
import { createAgentTools } from "./agent-tools";
import { stepCountIs, ToolLoopAgent } from "ai";
import { renderTerminalMarkdown } from "../../tui/terminal-md";
import { runApprovalFlow } from "./approval";
import { getAgentModel } from "../../ai";
import previousMessages from "../../ai/memory";
import {researchTool} from "./sub-agents/research.agent"

export async function runAgentMode() {
  try {
    console.log(chalk.bold("\n🤖 Agent Mode\n"));

    const goal = await text({
      message: "What would you like the agent to do?",
      placeholder: "Concrete task for this codebase…",
    });
    if (isCancel(goal) || !goal.trim()) return;

    const config = defaultAgentConfig();
    const tracker = new ActionTracker();
    const executor = new ToolExecutor(tracker, config);
    const tools = createAgentTools(executor);
    previousMessages.push({
      role: "user",
      content: goal.trim(),
    });
    // Optimized agent configuration for better performance
    const agent = new ToolLoopAgent({
      model: getAgentModel(),

      // Reduced steps for faster execution (was 15)
      stopWhen: stepCountIs(10),

      instructions: [
        `Workspace root: ${config.codebasePath}`,

        "You are the Main Developer Agent.",
        "You have access to specialized subagents.",

        "Delegate to the Research Agent only when the user asks to:",
        "- Read, analyze, or summarize README.md.",
        "- Understand the project's purpose, features, technologies, and setup instructions documented in README.md.",

        "Research Agent restrictions:",
        "- README.md is the only file within the Research Agent's scope.",
        "- Never delegate analysis of other project files to the Research Agent.",
        "- Always use tools to read the actual README.md before reporting.",
        "- Never assume implementation details that are not documented in README.md.",

        "For other development tasks:",
        "- Inspect relevant project files using available tools.",
        "- Understand existing code before modifying it.",
        "- Follow existing project architecture and coding conventions.",
        "- Prefer simple, maintainable solutions.",
        "- Avoid unnecessary dependencies and unrelated changes.",

        "Development workflow:",
        "- Understand the user's requirements.",
        "- Inspect relevant files before implementation.",
        "- Plan changes when the task requires multiple steps.",
        "- Implement changes using appropriate tools.",
        "- Verify changes using relevant tests, type checks, or builds.",
        "- Report modified files and verification results.",

        "Do not pretend to have inspected files without using tools.",
        "Never fabricate tool outputs or test results.",
        "Preserve existing user changes.",
        "All mutations are staged until explicit user approval.",
        "Never commit or apply staged changes without approval.",
        "Ask for clarification only when essential information is missing.",
        "Be concise, accurate, and focused.",
      ].join("\n"),
      tools: {
        research: researchTool,
        ...tools,
      },

      // Optimized retry and timeout settings
      maxRetries: 2, // Increased from 1 for better reliability
      temperature: 0.7, // Reduced from 1.0 for more focused responses
      topP: 0.9, // Slightly reduced for better consistency

      providerOptions: {
        nim: {
          chat_template_kwargs: {
            enable_thinking: false,
            force_nonempty_content: true,
          },
        },
      },
    });

    const result = await agent.generate({
      prompt: previousMessages,
      onStepFinish: ({ toolCalls }) => {
        for (const tc of toolCalls) {
          const preview = JSON.stringify(tc.input).slice(0, 160);
          console.log(
            chalk.green("  ✓"),
            chalk.bold(String(tc.toolName)),
            chalk.dim(preview + (preview.length >= 160 ? "..." : "")),
          );
        }
      },
    });
    previousMessages.push(...result.response.messages);

    if (result.text?.trim()) {
      console.log(renderTerminalMarkdown(result.text));
    }

    const ok = await runApprovalFlow(tracker);
    if (!ok) return executor.clearStaging();

    const { errors } = executor.applyApprovedFromTracker();

    if (errors.length) {
      console.log(chalk.red("\nSome operations reported errors:\n"));
      for (const e of errors) {
        console.log(chalk.red(`  • ${e}`));
      }
    } else {
      console.log(chalk.green("\n✓ Applied.\n"));
    }

    executor.clearStaging();
  } catch (error) {
    console.log(chalk.red(error));
  }
}