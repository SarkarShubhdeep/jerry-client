---
name: A3T Integration Issues
overview: Create GitHub issues to integrate a3t asset loader into jerry-cli, migrate from Node.js to Deno, and enable dynamic prompt loading without redeployment.
todos:
    - id: issue-1
      content: "Create Issue #1: Migrate jerry-cli from Node.js to Deno"
      status: completed
    - id: issue-2
      content: "Create Issue #2: Add a3t dependency and filesystem backend"
      status: completed
    - id: issue-3
      content: "Create Issue #3: Extract prompts to a3t-managed assets"
      status: completed
    - id: issue-4
      content: "Create Issue #4: Ship default prompt assets in jerry-cli/assets/"
      status: completed
    - id: issue-5
      content: "Create Issue #5: Add 'jerry report today' command"
      status: completed
    - id: issue-6
      content: "Create Issue #6: Documentation and testing workflow"
      status: completed
isProject: false
---

# A3T Integration - GitHub Issues Plan

## Overview

Integrate [a3t](https://github.com/mieweb/a3t) into jerry-cli to enable:

- Dynamic prompt loading without CLI redeployment
- Fast testing: ship defaults, override locally at `~/.config/jerry/assets/`
- Deno runtime migration (a3t has native Deno support)
- New `jerry report today` command for current day's work

## Current State

**jerry-cli** (Node.js + TypeScript):

- Three hardcoded prompts in [`jerry-cli/src/llm/prompt.ts`](jerry-cli/src/llm/prompt.ts):
    - `buildAskSystemPrompt` - for `jerry ask`
    - `buildJerrySystemPrompt` - for `jerry report` (main narrative)
    - `buildRecheckSystemPrompt` - for report recheck pass
- Time range parsing already handles custom dates (`yesterday`, `May 13 to May 20`, etc.)
- No assets directory yet

## Issue Breakdown

### Issue #1: Migrate jerry-cli from Node.js to Deno

**Goal:** Replace Node.js runtime with Deno to align with a3t's Deno-native support.

**Tasks:**

- Replace `package.json` scripts with Deno task runner (`deno.json`)
- Convert imports: `import ... from 'node:fs'`, `import ... from 'node:path'`
- Replace dependencies:
    - `commander` → [`cliffy`](https://deno.land/x/cliffy) or [`deno/std/flags`](https://deno.land/std/flags)
    - `@inquirer/prompts` → [`cliffy/prompt`](https://deno.land/x/cliffy/prompt)
    - `dotenv` → Deno built-in env or [`deno/std/dotenv`](https://deno.land/std/dotenv)
    - `openai` → verify Deno compatibility or use [`npm:` specifier](https://deno.land/manual/node/npm_specifiers)
- Update [`jerry-cli/tsconfig.json`](jerry-cli/tsconfig.json) → `deno.json` with compiler options
- Rewrite [`jerry-cli/src/cli.ts`](jerry-cli/src/cli.ts) entry point for Deno
- Update [`jerry-cli/README.md`](jerry-cli/README.md): replace `./jerry` wrapper with `deno task jerry` or `deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts`
- Test all commands (`ask`, `report`, `config`) work on Deno

**Acceptance:**

- `deno task build` compiles without errors
- `deno task jerry report "yesterday"` generates a valid report with ActivityWatch data
- `deno task jerry ask "hello"` returns LLM response
- `deno task jerry config show` displays settings

**Branch:** `jerry-cli/deno-migration` → `jerry-cli/a3t-integration`

---

### Issue #2: Add a3t dependency and filesystem backend

**Goal:** Install a3t and initialize with filesystem-only backend (no DB for v1).

**Tasks:**

- Add a3t to `deno.json` imports: `import a3t from "https://deno.land/x/a3t/deno.ts"`
- Create [`jerry-cli/src/assets/index.ts`](jerry-cli/src/assets/index.ts):
    - Initialize a3t with `fs: { rootPath: './assets' }` (shipped defaults)
    - Set override path to `~/.config/jerry/assets/` (local experimentation)
    - Export typed `getPrompt(key: string, defaultValue: string)` wrapper
- Design for future MongoDB support (don't implement yet):
    - Keep init config isolated in one file
    - Document `db: { mongodb: {...} }` option in code comments
- Add to config file schema: optional `a3t: { overridePath?: string }` for custom override location

**Acceptance:**

- `a3t.get('prompts/test.txt', 'default')` returns `'default'` when no file exists
- Creating `~/.config/jerry/assets/prompts/test.txt` with `'override'` makes `a3t.get()` return `'override'`
- No database backend is active in v1

**Branch:** same branch as Issue #1

---

### Issue #3: Extract prompts to a3t-managed assets

**Goal:** Replace hardcoded prompts in [`jerry-cli/src/llm/prompt.ts`](jerry-cli/src/llm/prompt.ts) with a3t asset loading.

**Current prompts to migrate:**

```typescript
// jerry-cli/src/llm/prompt.ts (lines 1-55)
export function buildAskSystemPrompt(modelId: string): string { ... }
export function buildJerrySystemPrompt(modelId: string, activityContext: string): string { ... }
export function buildRecheckSystemPrompt(modelId: string, activityContext: string): string { ... }
```

**Tasks:**

- Create asset keys (filename-friendly):
    - `prompts/ask.txt` - for `jerry ask`
    - `prompts/report.txt` - for main narrative generation
    - `prompts/recheck.txt` - for report review pass
- Refactor [`jerry-cli/src/llm/prompt.ts`](jerry-cli/src/llm/prompt.ts):
    - Replace functions with async `getAskPrompt(modelId: string)`, `getReportPrompt(modelId, activityContext)`, `getRecheckPrompt(modelId, activityContext)`
    - Each function calls `a3t.get('prompts/X.txt', hardcodedDefault)` and injects dynamic values (`${modelId}`, `${activityContext}`)
    - Keep current prompt text as inline defaults during transition
- Update callers in [`jerry-cli/src/llm/client.ts`](jerry-cli/src/llm/client.ts):
    - `buildAskSystemPrompt(modelId)` → `await getAskPrompt(modelId)`
    - `buildJerrySystemPrompt(modelId, ctx)` → `await getReportPrompt(modelId, ctx)`
    - `buildRecheckSystemPrompt(modelId, ctx)` → `await getRecheckPrompt(modelId, ctx)`

**Acceptance:**

- `jerry ask "hello"` and `jerry report "yesterday"` work with a3t-loaded prompts
- If no override exists, inline defaults are used (current behavior)
- Prompts are async-loaded but cached by a3t (no perf regression)

**Branch:** same branch

---

### Issue #4: Ship default prompt assets in jerry-cli/assets/

**Goal:** Extract inline defaults to versioned files for easier override experimentation.

**Tasks:**

- Create directory structure:
    ```
    jerry-cli/
      assets/
        prompts/
          ask.txt
          report.txt
          recheck.txt
    ```
- Move prompt text from [`jerry-cli/src/llm/prompt.ts`](jerry-cli/src/llm/prompt.ts) inline defaults to these files
- Use template variables: `{{modelId}}`, `{{activityContext}}` instead of TypeScript template literals
- Update `getAskPrompt()` etc. to:
    1. Load from a3t: `await a3t.get('prompts/ask.txt')`
    2. Replace templates: `.replace(/\{\{modelId\}\}/g, modelId)`
- Update [`jerry-cli/README.md`](jerry-cli/README.md):
    - Document asset override workflow
    - Example: "To customize the report prompt, copy `jerry-cli/assets/prompts/report.txt` to `~/.config/jerry/assets/prompts/report.txt` and edit"
- Add [`jerry-cli/assets/README.md`](jerry-cli/assets/README.md) with override instructions

**Acceptance:**

- Default prompts ship in `jerry-cli/assets/prompts/*.txt`
- Creating `~/.config/jerry/assets/prompts/report.txt` with modified text changes report output
- Deleting the override file reverts to shipped default
- No rebuild or restart required for override changes

**Branch:** same branch

---

### Issue #5: Add `jerry report today` command

**Goal:** Add convenience command for current day's work (midnight to now), distinct from `yesterday`.

**Current behavior:**

- `jerry report "yesterday"` → June 1 12:00 AM to June 1 11:59 PM (given today is June 2)
- `jerry report "today"` → June 2 12:00 AM to current time

**Tasks:**

- Add subcommand to [`jerry-cli/src/cli.ts`](jerry-cli/src/cli.ts):
    ```typescript
    .command('report today')
    .description('Generate today's work report (midnight to now)')
    .option('--stdout', 'Print markdown to stdout')
    .option('--dry-run', 'AW context only, no LLM')
    .action(async (opts) => {
      await runReport({ prompt: 'today', ...opts })
    })
    ```
- Alternatively, keep `jerry report` generic and document `today` as a time range keyword (already supported via [`jerry-cli/src/llm/activity-intent.ts`](jerry-cli/src/llm/activity-intent.ts) line 330: `if (/\btoday\b/.test(lower))`)
- Update [`jerry-cli/README.md`](jerry-cli/README.md) examples:
    ```bash
    ./jerry report today              # current day's work
    ./jerry report yesterday          # previous calendar day
    ./jerry report "May 13 to May 20" # custom range
    ```

**Acceptance:**

- `jerry report today` returns a report from midnight (local time) to current time
- Works with `--stdout` and `--dry-run` flags
- Help text documents the `today` time range

**Branch:** same branch

---

### Issue #6: Documentation and testing workflow

**Goal:** Document override testing workflow and add examples.

**Tasks:**

- Create [`docs/a3t-usage.md`](docs/a3t-usage.md):
    - Overview of a3t integration
    - Prompt override workflow (shipped defaults → local overrides)
    - Template variable syntax (`{{modelId}}`, `{{activityContext}}`)
    - Hot reload behavior (no restart needed)
    - Future: MongoDB override support for org-wide prompt management
- Update main [`README.md`](README.md):
    - Add "Dynamic Prompts" section linking to a3t
    - Example: testing a prompt change locally
- Add test scenario in [`jerry-cli/README.md`](jerry-cli/README.md):
    ```bash
    # Test a prompt change
    mkdir -p ~/.config/jerry/assets/prompts
    cp jerry-cli/assets/prompts/report.txt ~/.config/jerry/assets/prompts/report.txt
    # Edit ~/.config/jerry/assets/prompts/report.txt
    deno task jerry report "yesterday"  # uses override immediately
    ```
- Update [`jerry-cli/SYNC.md`](jerry-cli/SYNC.md):
    - Note prompts are now a3t-managed
    - Electron app should also consider a3t for prompt consistency

**Acceptance:**

- Developer can follow docs to:
    1. Clone repo
    2. Override a prompt locally
    3. Test with `jerry report`
    4. Commit the override to `jerry-cli/assets/` if it works
- Docs explain when to use inline defaults vs shipped files vs local overrides

**Branch:** same branch

---

## Notes from [`docs/a3t_integration.md`](docs/a3t_integration.md)

The handover doc mentions:

- `jerry start` command (not in current CLI) - **skip for v1**
- `prompts/fetch_aw_data.md`, `prompts/capture_snapshot.md`, `prompts/generate_report.md` - **consolidate into the 3 existing prompts**
- Terminal spinners/loaders - **already implemented** via [`jerry-cli/src/spinner.ts`](jerry-cli/src/spinner.ts)

## Timeline

**Phase 1 (Issues #1-2):** Deno migration + a3t setup (~1-2 days)
**Phase 2 (Issues #3-4):** Prompt extraction + asset shipping (~1 day)
**Phase 3 (Issues #5-6):** Commands + docs (~half day)

**Total:** 3-4 days of focused work, or 5-7 incremental PRs if done issue-by-issue.

## Success Criteria

After completing all issues:

- `deno task jerry report today` works without ActivityWatch errors
- Editing `~/.config/jerry/assets/prompts/report.txt` changes report output immediately
- Shipped defaults in `jerry-cli/assets/` are versioned and documented
- No Node.js dependencies remain (pure Deno)
- PR ready for `jerry-cli/a3t-integration` → `jerry-cli/main`
