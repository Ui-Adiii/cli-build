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
cli-build config set model "nvidia/nemotron-3-super-120b-a12b"

# Firecrawl - Web Search
cli-build config set firecrawl-api-key "your_firecrawl_api_key_here"

# Telegram Mode
cli-build config set telegram-bot-token "your_telegram_bot_token_here"
cli-build config set telegram-owner-id "your_telegram_user_id_here"
```

### 4. Configure environment variables in `.env` file

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

If a value is configured in both CLI configuration and `.env`, CLI configuration takes priority.

> Keep your real API keys and tokens private. Never commit `.env` or `~/.cli-build/config.json` to Git.

### 5. Run the application

```bash
cli-build
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

```env
NVIDIA_DEFAULT_MODEL=nvidia/nemotron-3-super-120b-a12b
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

## 🛡️ Safety Features

* **Staging Area** — Changes can be staged before applying them
* **Approval Flow** — Changes require user approval where configured
* **Limited Permissions** — Read-only tools are available where appropriate
* **Step Limits** — Limits agent iterations to help prevent runaway execution
* **Tool Restrictions** — Different modes expose different tool capabilities

## 📝 Project Structure

```text
cli/
├── index.ts                 # Main entry point
├── package.json             # Dependencies and scripts
├── .env.example             # Environment variable template
├── tui/                     # Terminal UI components
│   ├── wakeup.ts            # Banner and mode selection
│   └── terminal-md.ts       # Terminal Markdown rendering
├── modes/                   # Application modes
│   ├── cli/
│   │   ├── agent/           # Agent mode
│   │   ├── plan/            # Plan mode
│   │   └── ask/             # Ask mode
│   └── telegram/            # Telegram mode
├── ai/                      # AI provider and model configuration
```

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

## ✅ Verify the Installation

Run:

```bash
cli-build
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

## 🎉 Getting Started

For your first run:

```bash
bun install
bun link
cli-build
```

Then try:

1. **Ask Mode** — Ask a simple programming question
2. **Plan Mode** — Create an implementation plan
3. **Agent Mode** — Give the agent a small coding task
4. **Telegram Mode** — Connect your Telegram bot if configured

---

Built with **Bun**, **TypeScript**, and **NVIDIA AI**.
