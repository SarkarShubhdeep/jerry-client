# Jerry CLI (v0.1 experimental)

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

The `jerry` command is **not** on your PATH until you link it globally. Use any of these from the `jerry-cli/` directory:

```bash
./jerry report "give me report of my past hour work"     # wrapper script (recommended)
npm run jerry -- report "give me report of my past hour work"
npm run report -- "give me report of my past hour work"
node dist/cli.js report "give me report of my past hour work"
```

For a global `jerry` command everywhere:

```bash
npm link
jerry report "give me report of my past hour work"
```

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
jerry config show
jerry config set openai-api-key sk-...
jerry config set reports-dir ~/Documents/jerry-reports
jerry config remove openai-api-key
```

| Setting | Config key | Env override |
|---------|------------|--------------|
| API key | `openai-api-key` | `OPENAI_API_KEY` |
| Model | `openai-model` | `OPENAI_MODEL` |
| Reports output | `reports-dir` | `JERRY_REPORTS_DIR` |
| ActivityWatch URL | — | `ACTIVITYWATCH_BASE_URL` |

## Commands

```bash
jerry report "give me report of my past hour work"
jerry report --hours 2 "what did I work on"
jerry report --dry-run "today"          # AW context only, no LLM
jerry report --stdout "last hour"       # print markdown, no file
jerry config                            # show settings (masked)
jerry config set openai-api-key
jerry config set reports-dir ~/Documents/jerry-reports
jerry config remove openai-api-key
```

While a report runs, stderr shows a spinner (`-`, `\`, `|`, `/`) with the current step.

Each `report` run is isolated: **no chat history** and prior `.md` files are not sent to the model.

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
