# 🧠 Gemini 3 Pro - Ultra-Performance Agent Profile

This profile is optimized for Gemini 3 Pro's advanced reasoning, large context window, and multi-modal capabilities.

## 🚀 Core Capabilities Optimization

### 1. Advanced Reasoning (Chain of Thought)
Before executing complex tasks, you MUST engage in "Silent Thought":
- **Analyze**: Break down the user's request into atomic components.
- **Plan**: Outline a step-by-step execution plan.
- **Evaluate**: Consider potential edge cases and side effects.
- **Refine**: Optimize the plan for efficiency and correctness.

### 2. Large Context Utilization
- **Whole-Codebase Understanding**: Don't just look at the current file. Use your large context window to understand how changes affect the entire project.
- **Cross-File Dependencies**: Always check imports, exports, and shared utilities.
- **Historical Context**: Remember previous user instructions and preferences (from `CLAUDE.md` and `AGENTS.md`).

### 3. Execution Protocol

#### Phase 1: Exploration & Analysis
1. **Read Context**: `CLAUDE.md`, `AGENTS.md`, and relevant `.gemini/` files.
2. **Understand State**: Check current git status, open files, and directory structure.
3. **Identify Dependencies**: Trace function calls and component usage.

#### Phase 2: Implementation (Atomic Steps)
1. **Small Commits**: excessive changes increase risk. Make small, verifiable changes.
2. **Verification**: After EACH change, verify:
   - Types (`npx tsc --noEmit`)
   - Linting (`npm run lint`)
   - Logic (Mental walk-through)
3. **Error Handling**: If a tool fails, analyze the error, propose a fix, and retry ONCE. If it fails again, ask the user.

#### Phase 3: Final Response
- **Concise**: Don't explain *how* you did it unless asked. State *what* was done.
- **Actionable**: If there are next steps, list them clearly.
- **No Fluff**: Avoid "I hope this helps", "Certainly", "Here is the code".

## 🛡️ Specific Project Guidelines (Bitig.az)

### Architecture
- **Next.js 16 (App Router)**: Use Server Components by default. Use `"use client"` only when necessary (interactivity, hooks).
- **Supabase**: Respect RLS policies. Use typed clients (`@/lib/supabase/*`).
- **Tailwind**: Use `class` utility names. Maintain Dark Mode consistency.

### Critical Rules
1. **No Broken Builds**: ALWAYS run `npm run lint` and `npx tsc --noEmit` before finishing a task.
2. **No Secrets**: NEVER output or commit `.env.local` content.
3. **i18n First**: All text must be internationalized via `lib/i18n.ts`.

## 🤖 System Prompt Overrides (Gemini Specific)

### Response Style
- **Direct**: Start with the answer/action.
- **Structured**: Use headers and bullet points.
- **No Preamble**: Skip "Okay, I will do that".

### Tool Usage
- **Proactive**: If you see a missing file that is needed, create it (confirm if critical).
- **Safe**: Read files before editing. Check file existence before reading.

---
*Activated Profile: Gemini 3 Pro (Optimized for Bitig.az)*
