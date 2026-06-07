# Jerry CLI: A3T Integration Handover

## Project Overview

**Jerry** is a terminal-first productivity and reporting tool. To align with technical preferences, this project explicitly avoids GUI/Electron frameworks in favor of a fast, native CLI experience. The application runs on **Deno** and leverages the **A3T** (Universal Overridable Asset Loader) library to manage LLM prompts and system configurations as dynamically loaded string assets.

## Core Architecture

- **Runtime:** Deno (preferred over Node.js for this implementation)
- **Asset Management:** A3T (loads and overrides prompts/configs)
- **Interface:** Terminal/CLI with active state feedback (e.g., "loading asset...", "thinking...", "searching web...")
- **Data Sources:** Local telemetry integration, specifically ActivityWatch (AW) data.

## A3T Integration Strategy

Instead of hardcoding operational logic, Jerry uses A3T to manage LLM prompts as string assets.

- **Default Assets:** Shipped with the CLI (e.g., `prompts/report_daily.md`, `prompts/fetch_aw_data.md`).
- **The Override Mechanism:** A3T's primary value here is seamless local overriding. If a user needs to tweak the behavior of the daily report (e.g., changing the tone or structure), they simply place a modified prompt file in their local environment (e.g., `~/.jerry/assets/report_daily.md`). A3T will automatically prioritize this local asset over the default.

### Key Prompt Assets (Managed via A3T)

1.  `fetch_aw_data`: Instructions for the LLM on how to parse and format ActivityWatch logs.
2.  `capture_snapshot`: Prompt logic for summarizing the current desktop/window state.
3.  `generate_report`: The core prompt for synthesizing the day's data into a coherent summary.

## CLI Workflow & Commands

### 1. `jerry start`

Initializes the daemon/terminal session. Bootstraps the A3T loader, checks the filesystem for any local asset overrides, and establishes the Deno runtime environment.

### 2. `jerry report daily`

Triggers the end-of-day reporting workflow:

1.  CLI fetches the `generate_report` prompt via A3T.
2.  Provides standard terminal feedback: `[⠧] Loading daily asset report generator from A3T...`
3.  Injects ActivityWatch data and snapshots into the prompt context.
4.  Provides LLM processing feedback: `[⠧] Thinking...` -> `[⠧] Generating report...`
5.  Outputs the finalized markdown report to the terminal.

## Instructions for the AI Agent (Cursor/Opus)

1.  **Scaffold the Deno CLI:** Set up the basic CLI command routing structure (`start`, `report`).
2.  **Integrate A3T:** Implement the A3T loader to fetch the string assets. Ensure the override fallback directory structure is correctly configured so local prompt modifications work out-of-the-box.
3.  **Mock the LLM Pipeline:** Set up the scaffolding for the LLM calls that will eventually consume these A3T-managed prompts.
4.  **Implement CLI UX:** Integrate a terminal spinner/loader library to mimic the smooth state transitions discussed in the workflow (e.g., similar to the Claude CLI).
