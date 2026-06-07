# Jerry CLI (v0.1 experimental)

**Demo:** [Watch the Jerry CLI intro (YouTube Short)](https://youtube.com/shorts/_uOKAzkYQCI?si=HxvVj9MbRIvwimyT)

Headless, **stateless** work reports from [ActivityWatch](https://activitywatch.net/) and OpenAI. Independent of the Jerry desktop (Electron) app — same repo, no shared runtime dependency.

## Requirements

- Node.js 20+
- ActivityWatch running locally (default `http://localhost:5600`)
- `OPENAI_API_KEY` in the environment

## Install and run

```bash
cd jerry-cli
npm install
npm run build
export OPENAI_API_KEY=sk-...   # required for reports
```

From the `jerry-cli/` directory, use **`./jerry`** (the wrapper script in this folder). That is the normal way to run the CLI during development — you do **not** need a global `jerry` on your PATH.

```bash
./jerry report "give me report of my past hour work"     # recommended
npm run jerry -- report "give me report of my past hour work"
npm run report -- "give me report of my past hour work"
node dist/cli.js report "give me report of my past hour work"
```

**Optional — global `jerry` command:** run `npm link` once from `jerry-cli/`, then you can use `jerry` from any directory:

```bash
npm link
jerry report "give me report of my past hour work"
```

Throughout this README, `./jerry` means “from inside `jerry-cli/`”. After `npm link`, substitute `jerry` instead.

## Configure

Run **`./jerry config`** for an interactive menu (↑↓ to navigate, Enter to select):

- Set OpenAI API key
- Set reports directory
- Set OpenAI model
- Remove saved values from config file
- View full settings

Settings are stored in `~/.config/jerry/cli.json` (mode `0600`). Environment variables override file values.

Non-interactive (for scripts):

```bash
./jerry config show
./jerry config set openai-api-key sk-...
./jerry config set reports-dir ~/Documents/jerry-reports
./jerry config remove openai-api-key
```

| Setting | Config key | Env override |
|---------|------------|--------------|
| API key | `openai-api-key` | `OPENAI_API_KEY` |
| Model | `openai-model` | `OPENAI_MODEL` |
| Reports output | `reports-dir` | `JERRY_REPORTS_DIR` |
| ActivityWatch URL | — | `ACTIVITYWATCH_BASE_URL` |

## Commands

Run from `jerry-cli/` with `./jerry` (or `jerry` if you ran `npm link`):

```bash
./jerry ask "what is the difference between async and await?"
./jerry report "yesterday's work"
./jerry report "May 10 to May 13 this year"
./jerry report "June 1st"
./jerry report "give me report of my past hour work"
./jerry report --hours 2 "what did I work on"
./jerry report --dry-run "today"          # AW context only, no LLM
./jerry report --stdout "last hour"       # print markdown, no file
./jerry config                            # interactive settings menu
./jerry config set openai-api-key
./jerry config set reports-dir ~/Documents/jerry-reports
./jerry config remove openai-api-key
```

While a report runs, stderr shows a spinner (`-`, `\`, `|`, `/`) with the current step.

`ask` uses the same API key and model as `report` but does not read ActivityWatch. When the model uses web search, stderr shows `Searching web…` then `✓ Searched web`.

`report` only loads ActivityWatch for a **time range in your prompt** (e.g. `June 1`, `May 10 to May 13`, `yesterday`, `last 2 hours`, or `--hours`). A prompt with no range fails with examples.

Each `ask` and `report` run is isolated: **no chat history**.

## Release tarball

```bash
npm run pack:release
```

Produces `jerry-cli-0.1.0.tgz` for GitHub Releases. See [ISSUES.md](ISSUES.md) for v0.1 tracking ([#10](https://github.com/SarkarShubhdeep/jerry-client/issues/10)–[#12](https://github.com/SarkarShubhdeep/jerry-client/issues/12)).

## Branching

- Desktop: `main`, `feat/*`
- CLI experiment: `jerry-cli/main`, `jerry-cli/feat-*` → merge to `main` when ready

## Desktop app

The macOS Electron app lives at the repo root. See the [main README](../README.md). Prompt and behavior may drift from CLI intentionally during experiments; see [SYNC.md](SYNC.md).
