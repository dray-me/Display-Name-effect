# AI Prompts for JavaScript Display Name Styles System

This document contains specialized prompt templates designed for AI coding assistants. When utilizing these prompts, ensure that they are focused **strictly** on generating clean, native, and traditional CommonJS JavaScript code.

---

## 🎯 Master Generation Prompt

Use this prompt when instructing an AI to reconstruct or refactor the Display Name Styles codebase in ES6/CommonJS JavaScript:

```text
Role: High-Performance Discord Node.js/JavaScript Engineer
Partner Credits: KyronixStudio & dray.me

Instruction:
Generate a completely self-contained, robust, and professional CommonJS JavaScript module for styling a Discord Bot account's profile name using custom experimental display name styles.

Strict Rules:
1. ONLY produce valid CommonJS JavaScript code compatible with Node.js runtime. DO NOT output TypeScript or modern ESM (no "import/export" statements; use const/require and module.exports).
2. Utilize "require" for native imports of "fs" and "path".
3. Use modern, highly-readable ES6 class syntax.
4. Implement the native global Node.js "fetch" API (Node 18+) for all HTTP requests to bypass extra external library dependencies.
5. Provide detailed inline code comments instead of static interface annotations to guide the developer on parameter assumptions.
6. Implement rigorous exponential backoff retry algorithms when encountering Discord 429 Rate Limits or 5xx temporary server failures.
7. Safely wrap asynchronous operations to prevent uncaught rejections from interrupting standard Node.js event client loops.

Style Specs:
- Support 12 discrete fonts (including IDs 1-12 such as Bangers, BioRhyme, Cherry Bomb, Neo-Castel, etc.)
- Support 6 custom effects (Solid, Gradient, Neon, Toon, Pop, Glow)
- Support RGB integer arrays for display_name_colors.
- Support both nested Payload Format A ("display_name_styles": { ... }) and flat Payload Format B ("display_name_font_id": ...)

Code Structure:
The resulting module must export two core classes:
1. DiscordProfileAPI: Handles raw HTTP requests, retries, headers inspection, and is logged recursively.
2. ProfileStyleService: Resolves target presets, reads and writes working cached configurations from local filesystem JSON files, performs live capabilities/endpoint discovery, runs compatibility validation matrices, and summarizes accomplishments in a Markdown format.
```

---

## 🔧 Maintenance and Expansion Prompt

Use this prompt when updating the current JavaScript codebase (e.g., adding a new font, new effect, or refining ready event integrations):

```text
Instruction:
Refactor the existing CommonJS JavaScript ProfileStyleService codebase to integrate a new custom font or style effect.

Strict Rules:
1. Provide the complete code update written in JavaScript (CommonJS pattern) only.
2. Define the new font in the global raw "FONTS" array matching the existing schema: `{ label: string, value: string, id: number, description: string }`.
3. If an effect is being modified, ensure its index coordinates or validation guards are fully preserved.
4. Ensure no external CommonJS exports structure is broken. Use "module.exports" only.
```
