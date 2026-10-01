# Plan: Adding a New Refactor Mode to the CLI App

## Goal
Add a new CLI sub-mode called **Refactor** that helps users perform code refactoring tasks (e.g., renaming symbols, extracting functions, inlining variables) using the existing agent‑based infrastructure.

## Research Summary
- Existing modes (`agent`, `ask`, `plan`) each reside under `modes/<mode>/` and expose an orchestrator function (`run<Mode>Mode`) in `orchestrator.ts`.
- The orchestrator pattern:
  1. Prompt the user for a goal/task.
  2. Create a configuration object.
  3. Instantiate an `ActionTracker` and `ToolExecutor`.
  4. Build mode‑specific tools.
  5. Configure and run a `ToolLoopAgent` with appropriate model, instructions, and tool set.
  6. Handle approval flow and apply staged changes.
- CLI sub‑mode selection is handled in `modes/cli.ts` (`runCliMode`), which presents a menu and imports the orchestrator functions.
- The entry point from the main menu is `tui/wakeup.ts` → `runCliMode`.

## Implementation Steps
1. **Create the mode directory**
   ```bash
   mkdir -p modes/refactor
   ```
2. **Add type definitions** (if needed) – `modes/refactor/types.ts`
   - Reuse or extend `defaultAgentConfig` from `modes/agent/types.ts` or define a lightweight config.
3. **Implement the orchestrator** – `modes/refactor/orchestrator.ts`
   - Export `async function runRefactorMode()`.
   - Follow the same structure as `runAgentMode`:
     - Prompt for refactoring goal (e.g., “What refactoring would you like to perform?”).
     - Set up config, tracker, executor.
     - Create refactor‑specific tools (may start by reusing existing agent tools; add custom tools like `renameSymbol` later).
     - Instantiate `ToolLoopAgent` with appropriate instructions (e.g., “Workspace root: …”, “All mutations are staged until approval.”).
     - Run agent, render results, run approval flow, apply changes.
4. **Optional: Create specific tools** – `modes/refactor/refactor-tools.ts`
   - Implement functions that perform AST‑based refactorings (using a library like `@babel/types` or `ts-morph`) and return staged changes via the executor.
5. **Wire into CLI selector** – modify `modes/cli.ts`
   - Import `runRefactorMode` from `./refactor/orchestrator`.
   - Add `{ value: "refactor", label: "Refactor Mode" }` to the options list.
   - Add an `else if (mode === "refactor") { await runRefactorMode(); }` branch.
6. **Test the new mode**
   - Run the CLI: `bun run index.ts wakeup` (or directly `bun run index.ts`).
   - Navigate to CLI → Refactor Mode.
   - Verify that the prompt appears, the agent runs, and changes can be staged/approved.
7. **Ensure code quality**
   - Run `bun run tsc` to check for TypeScript errors.
   - Run any existing lint/format scripts.
   - Add a brief description in `README.md` if appropriate.

## Notes
- Reuse existing agent tools where possible to minimize duplication; the refactor mode can initially rely on the same tool set as the agent mode.
- If custom refactoring tools are added, they should follow the same tool interface expected by `ToolLoopAgent` (i.e., a callable with `name`, `description`, and `execute` returning a staged change via the executor).
- Keep the approval flow identical to other modes to maintain consistent UX.
- Consider adding a default configuration (e.g., model selection) that matches the agent mode unless a different behavior is desired.
- After implementation, update any relevant documentation (e.g., help text) to reflect the new mode.
