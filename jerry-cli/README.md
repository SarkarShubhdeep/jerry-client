# Jerry CLI (v0.1 experimental)

**Demo:** [Watch the Jerry CLI intro (YouTube Short)](https://youtube.com/shorts/_uOKAzkYQCI?si=HxvVj9MbRIvwimyT)

Headless, **stateless** work reports from [ActivityWatch](https://activitywatch.net/) and OpenAI. Independent of the Jerry desktop (Electron) app — same repo, no shared runtime dependency.

**⚠️ Migrated to Deno:** This CLI now runs on [Deno](https://deno.com/) instead of Node.js (Phase 1 of a3t integration).

## Requirements

- **Deno 2.0+** (replaces Node.js 20+)
- ActivityWatch running locally (default `http://localhost:5600`)
- `OPENAI_API_KEY` in the environment

## Install and run

```bash
cd jerry-cli

# Install Deno if you don't have it
curl -fsSL https://deno.land/install.sh | sh

# Set your OpenAI API key
export OPENAI_API_KEY=sk-...   # required for reports
```

From the `jerry-cli/` directory, use **`deno task jerry`** to run commands:

```bash
deno task jerry report "give me report of my past hour work"
deno task jerry ask "what is the difference between async and await?"
deno task jerry config
```

You can also run directly with `deno run`:

```bash
deno run --allow-net --allow-read --allow-write --allow-env src/cli.ts report "yesterday"
```

**Optional — make `jerry` executable:**

```bash
chmod +x src/cli.ts
./src/cli.ts report "yesterday"
```

## Configure

Run **`deno task jerry config`** for an interactive menu (↑↓ to navigate, Enter to select):

- Set OpenAI API key
- Set reports directory
- Set OpenAI model
- Remove saved values from config file
- View full settings

Settings are stored in `~/.config/jerry/cli.json` (mode `0600`). Environment variables override file values.

Non-interactive (for scripts):

```bash
deno task jerry config show
deno task jerry config set openai-api-key sk-...
deno task jerry config set reports-dir ~/Documents/jerry-reports
deno task jerry config remove openai-api-key
```

| Setting | Config key | Env override |
|---------|------------|--------------|
| API key | `openai-api-key` | `OPENAI_API_KEY` |
| Model | `openai-model` | `OPENAI_MODEL` |
| Reports output | `reports-dir` | `JERRY_REPORTS_DIR` |
| ActivityWatch URL | — | `ACTIVITYWATCH_BASE_URL` |

## Commands

Run from `jerry-cli/` with `deno task jerry`:

```bash
deno task jerry ask "what is the difference between async and await?"
deno task jerry report today                      # current day (midnight → now)
deno task jerry report yesterday                  # prior full calendar day
deno task jerry report "May 13 to May 20"         # custom date range
deno task jerry report "yesterday's work"
deno task jerry report "May 10 to May 13 this year"
deno task jerry report "June 1st"
deno task jerry report "give me report of my past hour work"
deno task jerry report --hours 2 "what did I work on"
deno task jerry report today --dry-run            # AW context only, no LLM
deno task jerry report today --stdout             # print markdown, no file
deno task jerry report --stdout "last hour"       # print markdown, no file
deno task jerry config                            # interactive settings menu
deno task jerry config set openai-api-key
deno task jerry config set reports-dir ~/Documents/jerry-reports
deno task jerry config remove openai-api-key
```

While a report runs, stderr shows a spinner (`-`, `\`, `|`, `/`) with the current step.

`ask` uses the same API key and model as `report` but does not read ActivityWatch. When the model uses web search, stderr shows `Searching web…` then `✓ Searched web`.

`report` only loads ActivityWatch for a **time range in your prompt** (e.g. `today`, `yesterday`, `June 1`, `May 10 to May 13`, `last 2 hours`, or `--hours`). A prompt with no range fails with examples.

Each `ask` and `report` run is isolated: **no chat history**.

## Prompt assets

LLM system prompts ship as text files under [`assets/prompts/`](assets/prompts/). Override locally without rebuilding:

```bash
mkdir -p ~/.config/jerry/assets/prompts
cp assets/prompts/report.txt ~/.config/jerry/assets/prompts/report.txt
# edit the copy, then rerun jerry — changes apply on the next command
deno task jerry report "yesterday"
```

See [`assets/README.md`](assets/README.md) for layout, template variables, and revert steps.

## Development

```bash
# Check types
deno task check

# Format code
deno task fmt

# Lint
deno task lint

# Build/cache dependencies
deno task build
```

## Branching

- Desktop: `main`, `feat/*`
- CLI experiment: `jerry-cli/main`, `jerry-cli/feat-*` → merge to `main` when ready
- a3t integration: `jerry-cli/a3t-integration`, `jerry-cli/deno-migration`

## Migration notes (Node.js → Deno)

This CLI was migrated from Node.js to Deno as Phase 1 of a3t integration:

- ✅ Replaced `package.json` with `deno.json` task runner
- ✅ Converted to `node:fs`, `node:path`, `node:os` imports for Node built-ins
- ✅ Replaced `commander` → `@cliffy/command`
- ✅ Replaced `@inquirer/prompts` → `@cliffy/prompt`
- ✅ Replaced `dotenv` → `@std/dotenv`
- ✅ OpenAI SDK via `npm:openai` specifier (Deno-compatible)
- ✅ All `process.*` → `Deno.*` equivalents

See issue [#16](https://github.com/SarkarShubhdeep/jerry-client/issues/16) and branch `jerry-cli/deno-migration`.

## Desktop app

The macOS Electron app lives at the repo root. See the [main README](../README.md). Prompt and behavior may drift from CLI intentionally during experiments; see [SYNC.md](SYNC.md).
