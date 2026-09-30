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

export async function runAgentMode() {
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

  // Optimized agent configuration for better performance
  const agent = new ToolLoopAgent({
    model: getAgentModel(),

    // Reduced steps for faster execution (was 15)
    stopWhen: stepCountIs(10),

    instructions: [
      `Workspace root: ${config.codebasePath}`,
      "All mutations are staged until approval.",
      "Be concise and focused in your responses.",
    ].join("\n"),

    tools,

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
    prompt: goal.trim(),
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
}