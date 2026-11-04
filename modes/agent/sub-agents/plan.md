# AI Subagent Testing Prompts

A collection of 9 prompts to test specialized subagents and Main Developer Agent coordination.

---

## 1. Research Agent — README Analysis (Completed✅)

Use the Research Agent to inspect the actual `README.md`.

Explain:
1. What this project does.
2. Which technologies it uses.
3. Its documented features.
4. Installation and setup instructions.
5. How to run the project.

**Constraints:**
- Do not inspect or analyze any other files.
- Do not modify anything.
- Base findings on the actual README.md contents.

## 2. Codebase Analysis Agent

Analyze the existing codebase.

Explain:
1. Overall project architecture.
2. Folder and file structure.
3. Main modules and their responsibilities.
4. How different modules interact.
5. Important dependencies.

**Constraints:**
- Inspect actual project files using tools.
- Do not assume anything based on README.md alone.
- Do not modify files.

## 3. Code Analysis Agent

Inspect the authentication implementation.

Explain:
1. Authentication flow.
2. How user registration and login work.
3. How tokens and sessions are managed.
4. How middleware protects routes.
5. Potential security or architectural issues.

**Constraints:**
- Use actual source files as evidence.
- Include relevant file paths.
- Do not modify anything.

## 4. Bug Investigation Agent

Investigate the codebase for potential bugs.

Tasks:
1. Inspect relevant source files.
2. Identify possible runtime errors.
3. Check edge cases and error handling.
4. Identify performance issues.
5. Explain the root cause of confirmed issues.

**Constraints:**
- Do not modify files.
- Distinguish confirmed bugs from potential issues.
- Provide file paths and relevant code references.

## 5. Technical Research Agent

Research how to implement Redis caching in this project.

Tasks:
1. Inspect the existing architecture.
2. Identify suitable integration points.
3. Evaluate compatible libraries.
4. Explain the implementation approach.
5. Identify potential trade-offs.

**Constraints:**
- Provide practical recommendations.
- Do not install dependencies.
- Do not modify files.

## 6. Planning Agent

Create an implementation plan for adding Role-Based Access Control (RBAC).

Include:
1. Existing architecture analysis.
2. Required changes.
3. Files that need modification.
4. Database changes.
5. API and middleware changes.
6. Testing strategy.
7. Potential risks.

**Constraints:**
- Do not implement anything.
- Provide a clear step-by-step plan.

## 7. Implementation Agent

Implement a JWT refresh-token authentication flow.

Requirements:
1. Follow the existing project architecture.
2. Reuse existing utilities and dependencies.
3. Handle token expiration.
4. Implement secure refresh-token validation.
5. Handle invalid and revoked tokens.
6. Add appropriate error handling.
7. Include relevant tests if supported.

**Constraints:**
- Stage all modifications for approval.
- Do not commit changes.
- Preserve existing user modifications.

## 8. Multi-Agent Coordination

Analyze how to improve the existing authentication system.

Tasks:
1. Check available subagents.
2. Delegate relevant independent research tasks.
3. Collect and review their findings.
4. Identify architectural problems.
5. Prepare a unified implementation plan.
6. Present recommendations with file references.

**Constraints:**
- Do not modify files.
- The Main Developer Agent must review all subagent results.
- Avoid duplicate delegation.

## 9. Code Review Agent

Perform a code review of the existing project.

Check:
1. Code quality and readability.
2. Security vulnerabilities.
3. Error handling.
4. Performance bottlenecks.
5. Duplicate or unnecessary code.
6. Maintainability.

Classify findings by severity:

- Critical
- High
- Medium
- Low

**Constraints:**
- Provide file paths and explanations.
- Prioritize actionable findings.
- Do not modify files.
- Do not report speculative issues as confirmed vulnerabilities.

---

## Recommended Testing Order

| Step | Agent | Purpose |
|---|---|---|
| 1 | Research | README understanding |
| 2 | Codebase Analysis | Architecture understanding |
| 3 | Code Analysis | Source-code investigation |
| 4 | Bug Investigation | Bug detection |
| 5 | Technical Research | Technical solutions |
| 6 | Planning | Implementation planning |
| 7 | Implementation | Feature development |
| 8 | Multi-Agent Coordination | Delegation and collaboration |
| 9 | Code Review | Quality verification |

## Success Criteria

- Agents use actual tools rather than making assumptions.
- Delegation happens only when appropriate.
- Subagent results are reviewed by the Main Developer Agent.
- File modifications remain staged until approval.
- No fabricated file contents, test results, or tool outputs.
- Final responses are concise and actionable.