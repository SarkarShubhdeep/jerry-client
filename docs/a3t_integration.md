# Jerry CLI: A3T Integration Handover

> **For usage and override workflow, see [a3t-usage.md](a3t-usage.md).**

## Project Overview

**Jerry CLI** is a terminal-first productivity and reporting tool in the `jerry-cli/` package. It runs on **Deno** and uses **A3T** (Universal Overridable Asset Loader) to manage LLM prompts as dynamically loaded string assets.

## Core Architecture

- **Runtime:** Deno
- **Asset management:** A3T with a layered filesystem backend (local override → shipped default)
- **Interface:** Terminal/CLI with spinner feedback during report generation
- **Data sources:** ActivityWatch (localhost HTTP API)

## A3T Integration Strategy

Instead of hardcoding prompts, Jerry CLI loads them via a3t:

- **Shipped defaults:** `jerry-cli/assets/prompts/ask.txt`, `report.txt`, `recheck.txt`
- **Local overrides:** `~/.config/jerry/assets/` (or custom `a3t.overridePath` in `cli.json`)

### Key Prompt Assets

| File | Purpose |
|------|---------|
| `prompts/ask.txt` | `jerry ask` system prompt |
| `prompts/report.txt` | `jerry report` generation prompt |
| `prompts/recheck.txt` | Post-draft report review prompt |

Template variables `{{modelId}}` and `{{activityContext}}` are injected at runtime. See [a3t-usage.md](a3t-usage.md).

## CLI Workflow & Commands

Implemented commands (run from `jerry-cli/`):

```bash
deno task jerry report today       # current day (midnight → now)
deno task jerry report yesterday   # prior full calendar day
deno task jerry report "May 13 to May 20"   # custom date range
deno task jerry ask "your question"
deno task jerry config
```

Report workflow:

1. CLI resolves the `report.txt` prompt via a3t (override or shipped default)
2. Fetches ActivityWatch data for the requested time range
3. Injects `{{activityContext}}` and `{{modelId}}` into the prompt
4. Calls OpenAI and writes a `.md` report (or prints with `--stdout`)

There is no `jerry start` daemon or `report daily` subcommand — use `report today` or `report yesterday`.

## Implementation Status

| Phase | Issue | Status |
|-------|-------|--------|
| Deno migration | [#16](https://github.com/SarkarShubhdeep/jerry-client/issues/16) | Done |
| a3t filesystem backend | [#17](https://github.com/SarkarShubhdeep/jerry-client/issues/17) | Done |
| Extract prompts to a3t | [#18](https://github.com/SarkarShubhdeep/jerry-client/issues/18) | Done |
| Ship default assets | [#19](https://github.com/SarkarShubhdeep/jerry-client/issues/19) | Done |
| `report today` / time ranges | [#20](https://github.com/SarkarShubhdeep/jerry-client/issues/20) | Done |
| Documentation | [#21](https://github.com/SarkarShubhdeep/jerry-client/issues/21) | Done |

Code: `jerry-cli/src/assets/index.ts`, `jerry-cli/src/llm/prompt.ts`.
