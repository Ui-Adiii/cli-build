# CLI Build

A versatile CLI tool built with **Bun** and **TypeScript** that provides AI-powered modes for code assistance, planning, and Telegram integration.

## 🚀 Features

* **CLI Mode** — Agent, Plan, and Ask sub-modes for code assistance
* **Telegram Mode** — Interact with the AI through a Telegram bot
* **AI-Powered** — Uses NVIDIA AI models through the NVIDIA API
* **Web Search** — Optional Firecrawl integration for web research
* **Safe Operations** — Changes can be staged and require approval before being applied
* **Tool Calling** — AI agents can inspect and work with the project through configured tools
* **Plan Mode** — Research a codebase and generate implementation plans

## 📋 Prerequisites

* [Bun](https://bun.sh) installed
* NVIDIA API key — required
* Firecrawl API key — optional, for web search
* Telegram Bot Token — optional, for Telegram mode

## 🔧 Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Link the CLI

To use `cli-build` as a global command from any directory, link the project using Bun:

```bash
bun link
```

### 3. Configure through CLI

After installing dependencies, configure the CLI using the following commands:

```bash
# NVIDIA configuration
cli-build config set nvidia-api-key "your_nvidia_api_key_here"
cli-build config set model "nvidia/nemotron-3-super-vl-120b-a12b"

# Fallback model if the primary model is unavailable
cli-build config set model "nvidia/nemotron-3-ultra-550b-a55b"

# Firecrawl - Web Search
cli-build config set firecrawl-api-key "your_firecrawl_api_key_here"

# Telegram Mode
cli-build config set telegram-bot-token "your_telegram_bot_token_here"
cli-build config set telegram-owner-id "your_telegram_user_id_here"
```

### 4. Configure environment variables in `.env` file (optional)

Create a `.env` file in the project root.

You can use `.env.example` as a template:

```env
# Required
NVIDIA_API_KEY=your_nvidia_api_key_here

# Optional but recommended
FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Optional - for Telegram mode
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_OWNER_ID=your_telegram_user_id_here

# NVIDIA Models
NVIDIA_DEFAULT_MODEL=nvidia/nemotron-3-super-120b-a12b
```

If the primary model is unavailable, you can change the value to:
```text
NVIDIA_DEFAULT_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

If a value is configured in both CLI configuration and `.env`, CLI configuration takes priority.

> Keep your real API keys and tokens private. Never commit `.env` or `~/.cli-build/config.json` to Git.

### 5. Run the application

```bash
cli-build wakeup 
```

## 🎯 Usage

### Main Menu

When you start the application, you can choose between:

* **CLI Mode** — Access Agent, Plan, and Ask modes
* **Telegram Mode** — Interact with the AI through Telegram
* **Exit** — Quit the application

---

## ❓ Ask Mode

Ask questions about your codebase or programming topics.

1. Select **Ask Mode**
2. Enter your question
3. The AI analyzes the available context and tools
4. Receive an AI-generated answer
5. Optionally save the response if supported

**Best for:** Quick questions, explanations, debugging, and codebase exploration.

---

## 🧭 Plan Mode

Create step-by-step implementation plans for larger tasks.

1. Select **Plan Mode**
2. Enter your goal
3. The AI researches the relevant parts of the workspace
4. Review the generated implementation plan
5. Select the steps you want to execute
6. Confirm before implementation

**Example:**

```text
Create a REST API for user management
```

**Best for:** New features, architectural changes, and complex implementation tasks.

---

## 🤖 Agent Mode

Give the AI a concrete coding task and let it work through the task using available tools.

1. Select **Agent Mode**
2. Enter a concrete task
3. The agent analyzes the workspace
4. The agent performs the required operations
5. Review changes before applying them

**Example:**

```text
Add error handling to the login function
```

**Best for:** Coding tasks, refactoring, debugging, and project modifications.

---

## 💬 Telegram Mode

Interact with the AI through Telegram.

1. Select **Telegram Mode**
2. The bot starts using your configured Telegram credentials
3. Open your Telegram bot
4. Send messages normally
5. Press `Ctrl+C` in the terminal to stop the bot

Requires:

```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_OWNER_ID=your_telegram_user_id_here
```

---

## ⚙️ Configuration

### Model Selection

The model can be configured through CLI configuration or environment variables:

```bash
cli-build config set model "nvidia/nemotron-3-super-120b-a12b"
```

Alternative model:

If nvidia/nemotron-3-super-120b-a12b is unavailable or fails, configure:
```bash
cli-build config set model "nvidia/nemotron-3-ultra-550b-a55b"
```

For .env configuration:
```env
NVIDIA_DEFAULT_MODEL=nvidia/nemotron-3-super-120b-a12b
```

If needed, replace it with:
```env
NVIDIA_DEFAULT_MODEL=nvidia/nemotron-3-ultra-550b-a55b
```

| Variable | Purpose |
| ---------------------- | ----------------------------------------------- |
| `NVIDIA_DEFAULT_MODEL` | Model used by default for Ask and Agent modes |
| `FIRECRAWL_API_KEY` | Enables optional web search |
| `TELEGRAM_BOT_TOKEN` | Enables Telegram integration |
| `TELEGRAM_OWNER_ID` | Restricts Telegram access to the configured user |

You can replace the NVIDIA model IDs with other compatible models supported by your configuration.

### 💳 Using Paid Models

If you want to use **paid AI models** or a different AI provider, you can change the AI provider and model configuration in:

```text
ai/ai.config.ts
```

### Configuration File Location

CLI configuration is stored at:

```
~/.cli-build/config.json
```

This file is created automatically when you run `cli-build config set <key> <value>`. It contains:

* `nvidia-api-key`
* `model`
* `firecrawl-api-key`
* `telegram-bot-token`
* `telegram-owner-id`

---

## 🛡️ Safety Features

* **Staging Area** — Changes can be staged before applying them
* **Approval Flow** — Changes require user approval where configured
* **Limited Permissions** — Read-only tonols are available where appropriate
* **Step Limits** — Limits agent iterations to help prevent runaway execution
* **Tool Restrictions** — Different modes expose different tool capabilities

### How Staging Works

When the Agent or Plan mode proposes file changes:

1. Changes are staged in an in-memory overlay (not written to disk yet)
2. Each action is logged with a status: `pending`, `approved`, or `rejected`
3. A diff is generated so you can review before approving
4. You can approve all changes at once, review them one-by-one, or cancel
5. Only approved changes are applied to the filesystem
6. Staging is cleared after apply or cancel

---

## 📁 Project Structure

```
cli-build/
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
├── bun.lock                   # Bun lockfile
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript configuration
├── index.ts                   # CLI entry point (Commander.js)
│
├── ai/
│   ├── ai.config.ts           # LLM model provider config (NVIDIA NIM)
│   ├── index.ts               # Re-exports getAgentModel
│   └── memory.ts              # Shared conversation memory (ModelMessage[])
│
├── config/
│   └── config.ts              # Config file path & loader (~/.cli-build/config.json)
│
├── tui/
│   ├── terminal-md.ts         # Markdown rendering for terminal
│   └── wakeup.ts              # Welcome banner + mode selector
│
├── modes/
│   ├── cli.ts                 # Interactive CLI mode selector (ask/plan/agent)
│   ├── agent/
│   │   ├── orchestrator.ts    # Main agent mode loop + sub-agent delegation
│   │   ├── types.ts           # Action types, AgentConfig, defaults
│   │   ├── action-tracker.ts  # Staged action logging & status tracking
│   │   ├── agent-tools.ts     # File system tool definitions (zod schemas)
│   │   ├── approval.ts        # Interactive approval flow (CLI)
│   │   ├── diff-view.ts       # Diff generation for staged changes
│   │   ├── tool-executor.ts   # Core FS executor (read/write/delete/stage/apply)
│   │   └── sub-agents/
│   │       ├── bug-investigation.agent.ts    # Runtime errors, edge cases, performance
│   │       ├── code-analysis.agent.ts        # Auth flow, tokens, sessions, security
│   │       ├── code-review.agent.ts          # Code quality, security, performance
│   │       ├── codebase-analysis.agent.ts    # Architecture, folder structure, deps
│   │       ├── implementation.agent.ts       # Feature implementation, file changes
│   │       ├── multi-agent-coordination.agent.ts # Coordinate multiple subagents
│   │       ├── planning.agent.ts             # Implementation plans, risk assessment
│   │       ├── research.agent.ts             # General research, README analysis
│   │       └── technical-research.agent.ts   # Library evaluation, trade-offs
│   │       └── plan.md                       # Sub-agent planning notes
│   ├── ask/
│   │   └── orchestrator.ts    # Ask mode (Q&A about codebase)
│   ├── plan/
│   │   ├── orchestrator.ts    # Plan mode (goal → steps → execution)
│   │   ├── planner.ts         # Plan generation (JSON schema via LLM)
│   │   ├── selection.ts       # Plan step selection UI
│   │   ├── types.ts           # PlanStep, Plan interfaces
│   │   └── web-tools.ts       # Firecrawl web search/crawl/fetch tools
│   └── telegram/
│       ├── index.ts           # Telegram bot entry (Telegraf)
│       ├── agent-run.ts       # Ask/Agent/Plan execution for Telegram
│       ├── approval-session.ts # Telegram inline approval flow
│       ├── auth.ts            # Owner-only access control
│       ├── constants.ts       # Welcome message
│       ├── handlers.ts        # Command & callback query handlers
│       ├── plan-session.ts    # In-memory plan session state
│       └── text.ts            # Text utilities (clip, replyMd, commandArg)
```

### Module Overview

| Module | Responsibility |
|--------|---------------|
| `index.ts` | CLI command definitions (`wakeup`, `config set/get`) |
| `ai/` | AI provider config (NVIDIA NIM), shared conversation memory |
| `config/` | Reads/writes `~/.cli-build/config.json` |
| `tui/` | Terminal UI: banner, mode selector, markdown rendering |
| `modes/cli.ts` | Interactive menu: Ask / Plan / Agent / Back |
| `modes/agent/` | Full agent with file operations, staging, approval, sub-agents |
| `modes/ask/` | Read-only Q&A about the codebase |
| `modes/plan/` | Goal → structured plan → step selection → execution |
| `modes/telegram/` | Telegram bot with owner auth, inline approval, plan sessions |

---

## 🔍 Troubleshooting

### API key not loaded

The CLI supports both CLI configuration and `.env` configuration.

For `.env`, check that:

1. `.env` exists in the project root.
2. `NVIDIA_API_KEY` is set correctly.
3. The API key is valid.
4. You restarted the CLI after changing environment variables.

You can safely check whether Bun sees the key without printing it:

```bash
bun -e "console.log(Boolean(process.env.NVIDIA_API_KEY))"
```

It should print:

```text
true
```

### Telegram not working

Check:

* Your Telegram bot token is correct.
* `TELEGRAM_OWNER_ID` contains the correct numeric Telegram user ID.
* You have started a conversation with the bot.
* The bot is running in Telegram mode.

### Slow responses

Response time depends on the selected model, request size, tool usage, reasoning configuration, and current API/server conditions.

For example, different NVIDIA models can have significantly different response times.

If a model consistently responds slowly, try another compatible NVIDIA model.

### Missing web search

Set through CLI:

```bash
cli-build config set firecrawl-api-key "your_firecrawl_api_key_here"
```

Or use `.env`:

```env
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

Then restart the CLI.

### Configuration not persisting

CLI configuration is stored at `~/.cli-build/config.json`. If settings are not persisting:

1. Check that `~/.cli-build/` directory is writable.
2. Verify the config file exists and contains valid JSON.
3. Re-run `cli-build config set <key> <value>` to re-set values.

---

## ✅ Verify the Installation

Run:

```bash
cli-build wakeup
```

Then:

1. Select **CLI Mode**
2. Select **Ask Mode**
3. Ask:

```text
What is 2+2?
```

If the AI responds successfully, your NVIDIA configuration is working.

You can then test Plan Mode:

```text
Explain how to create a basic HTTP server
```

Finally, test Agent Mode with a small, safe task.

---

## 🎉 Getting Started

For your first run:

```bash
bun install
bun link
cli-build wakeup
```

Then try:

1. **Ask Mode** — Ask a simple programming question
2. **Plan Mode** — Create an implementation plan
3. **Agent Mode** — Give the agent a small coding task
4. **Telegram Mode** — Connect your Telegram bot if configured

---

## 📦 Dependencies

### Runtime Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | ^7.0.118 | AI SDK core — ToolLoopAgent, tool, generateText, etc. |
| `@ai-sdk/openai-compatible` | ^3.0.57 | OpenAI-compatible provider adapter (NVIDIA NIM) |
| `@clack/core` | ^1.5.1 | Interactive CLI prompts core |
| `@clack/prompts` | ^1.8.1 | Interactive CLI prompts (select, text, confirm) |
| `@mendable/firecrawl-js` | ^4.42.0 | Web search/crawl/scrape API client |
| `chalk` | ^6.0.1 | Terminal color styling |
| `commander` | ^15.0.0 | CLI command framework |
| `diff` | ^9.0.0 | Unified diff generation for staged changes |
| `figlet` | ^1.11.4 | ASCII art banner |
| `marked` | ^18.0.14 | Markdown parsing |
| `marked-terminal` | ^7.3.0 | Markdown rendering in terminal |
| `telegraf` | ^4.16.3 | Telegram bot framework |

### Dev Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@types/bun` | ^1.4.2 | Bun runtime type definitions |
| `@types/marked-terminal` | ^6.1.1 | Types for marked-terminal |
| `@types/node` | ^26.6.3 | Node.js type definitions |

### Peer Dependencies

* `typescript` ^7

---

## 🏗️ Architecture

### Data Flow: CLI Startup → Mode Selection

```
index.ts (commander)
  └── "wakeup" command
        └── tui/wakeup.ts (runWakeUp)
              ├── Figlet ASCII banner
              └── select: CLI | Telegram | Exit
                    ├── CLI → modes/cli.ts (runCliMode)
                    │     ├── select: ask | plan | agent | back
                    │     ├── ask → modes/ask/orchestrator.ts
                    │     ├── plan → modes/plan/orchestrator.ts
                    │     └── agent → modes/agent/orchestrator.ts
                    └── Telegram → modes/telegram/index.ts (runTelegramMode)
```

### Data Flow: Agent Mode Execution (CLI)

```
modes/agent/orchestrator.ts (runAgentMode)
  ├── User provides goal
  ├── ActionTracker + ToolExecutor instantiated
  ├── defaultAgentConfig() applied
  ├── ToolLoopAgent with:
  │   ├── Model: getAgentModel() → NVIDIA NIM via @ai-sdk/openai-compatible
  │   ├── Tools: createAgentTools() (file ops, shell, search)
  │   └── Sub-agent tools: researchTool, codebaseAnalysisTool, implementationTool, etc.
  ├── Agent generates response, calls tools
  ├── ToolExecutor logs actions to ActionTracker (staged, pending)
  ├── Approval flow (approval.ts): interactive approve/reject with diffs
  ├── ToolExecutor.applyApprovedFromTracker(): writes files, runs shell, creates folders
  └── clearStaging()
```

### Data Flow: Sub-Agent Delegation

```
Main Agent (orchestrator.ts)
  └── Delegates to sub-agent tool (e.g., codebaseAnalysisTool)
        └── Sub-agent ToolLoopAgent (e.g., codebaseAnalysisAgent)
              ├── Restricted read-only tools
              ├── Independent investigation
              └── Returns findings text to Main Agent
```

### Data Flow: Plan Mode Execution

```
modes/plan/orchestrator.ts (runPlanMode)
  ├── User provides goal
  ├── planner.ts (generatePlan) → structured JSON Plan (goal, researchSummary, steps[])
  ├── selection.ts: printPlan + selectSteps (interactive multiselect)
  ├── For each selected step:
  │   └── ToolLoopAgent executes step with full toolset
  ├── Approval flow (shared with agent mode)
  └── Apply approved changes
```

### Data Flow: Telegram Mode

```
modes/telegram/index.ts (runTelegramMode)
  ├── Telegraf bot with token + owner ID
  └── handlers.ts (registerHandlers)
        ├── /ask → agent-run.ts (runAsk) → read-only agent
        ├── /agent → agent-run.ts (runAgent) → full agent + approval
        ├── /plan → planner.ts generates plan → plan-session.ts stores state
        │     └── Inline keyboard: toggle steps / proceed
        │     └── agent-run.ts (runPlanSteps) executes selected steps
        └── approval-session.ts: inline keyboard accept/reject/diff
```

---

## 🛡️ Security Notes

* Never commit `.env` or `~/.cli-build/config.json` to version control.
* The `.gitignore` file should include `.env` and `~/.cli-build/`.
* Telegram mode restricts access to a single owner ID (`TELEGRAM_OWNER_ID`).
* File operations are staged and require explicit approval before being applied to disk.
* Shell command execution is available only in Agent mode and requires approval.

---

## 🎉 Getting Started

For your first run:

```bash
bun install
bun link
cli-build wakeup
```

Then try:

1. **Ask Mode** — Ask a simple programming question
2. **Plan Mode** — Create an implementation plan
3. **Agent Mode** — Give the agent a small coding task
4. **Telegram Mode** — Connect your Telegram bot if configured

---

Built with **Bun**, **TypeScript**, and **NVIDIA AI**.