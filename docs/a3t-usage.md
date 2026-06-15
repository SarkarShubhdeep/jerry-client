# Jerry CLI — a3t usage and prompt overrides

Jerry CLI uses [a3t](https://github.com/mieweb/a3t) (Universal Overridable Asset Loader) with a layered filesystem backend. LLM system prompts live as text files instead of hardcoded strings, so contributors can iterate on prompt wording without rebuilding the CLI.

For architecture background, see [a3t_integration.md](a3t_integration.md). Shipped prompt files live in [@sarkarshubhdeep/jerry-lib](https://github.com/SarkarShubhdeep/jerry-lib) under `assets/prompts/` (consumed via JSR).

## Asset layout

Shipped defaults are bundled in [@sarkarshubhdeep/jerry-lib](https://jsr.io/@sarkarshubhdeep/jerry-lib):

```
assets/prompts/   # in SarkarShubhdeep/jerry-lib repo
  ask.txt         # `jerry ask` system prompt
  report.txt      # `jerry report` generation prompt
  recheck.txt     # post-draft report review prompt
```

## Three-tier resolution

When the CLI loads a prompt, a3t resolves it in this order:

1. **Local override** — `~/.config/jerry/assets/` (or a custom path via `a3t.overridePath` in `cli.json`)
2. **Shipped default** — bundled in `@sarkarshubhdeep/jerry-lib` on JSR (edit in [jerry-lib repo](https://github.com/SarkarShubhdeep/jerry-lib) and publish a new version)
3. **Inline fallback** — empty string passed from `getPrompt()` in code; only used if neither override nor shipped file exists (development edge case)

Delete a local override file to revert to the shipped default on the next command.

## Override workflow

Copy a shipped prompt to your config directory, edit it, and rerun — no rebuild required:

```bash
mkdir -p ~/.config/jerry/assets/prompts
# Seed from jerry-lib repo (or export from a running install)
curl -o ~/.config/jerry/assets/prompts/report.txt \
  https://raw.githubusercontent.com/SarkarShubhdeep/jerry-lib/main/assets/prompts/report.txt
# edit ~/.config/jerry/assets/prompts/report.txt
deno task jerry report "yesterday"   # uses override on the next run
```

Optional custom override directory in `~/.config/jerry/cli.json`:

```json
{
  "a3t": {
    "overridePath": "~/path/to/my/assets"
  }
}
```

## Template variables

Prompts can include placeholders replaced at runtime:

| Variable | Used in | Replaced with |
|----------|---------|---------------|
| `{{modelId}}` | all prompts | OpenAI model ID from config |
| `{{activityContext}}` | `report.txt`, `recheck.txt` | ActivityWatch data block for the report window |

Example from `report.txt`:

```text
This request uses the OpenAI API with model ID `{{modelId}}`. When asked what model you are, answer with this exact model ID.
...
{{activityContext}}
```

## Hot reload

Each `deno task jerry` invocation starts a fresh process. Edits to override files apply on the **next command** — no daemon restart, no rebuild, no cache clear needed.

## `report` time ranges

`jerry report` parses a time range from your prompt (there is no separate `report daily` subcommand):

| Input | Behavior |
|-------|----------|
| `today` | Local midnight → now |
| `yesterday` | Prior full calendar day |
| `"May 13 to May 20"` | Custom date range |
| `last 2 hours`, `past hour` | Rolling window |
| `--hours N` | Override with a fixed hour window |

Examples (run from `jerry-cli/`):

```bash
deno task jerry report today
deno task jerry report yesterday
deno task jerry report "May 13 to May 20"
deno task jerry report --hours 2 "what did I work on"
deno task jerry report today --dry-run    # ActivityWatch context only, no LLM
```

## Contributor workflow

End-to-end flow for prompt changes:

1. **Clone** [SarkarShubhdeep/jerry-lib](https://github.com/SarkarShubhdeep/jerry-lib) for shipped defaults (or override locally in jerry-cli for quick tests)
2. **Override locally** — copy a prompt to `~/.config/jerry/assets/prompts/` and edit
3. **Test** — from `jerry-cli/`: `deno task jerry report yesterday` (or `today`, custom range, `--dry-run`)
4. **Ship** — open a PR in jerry-lib with the prompt change, publish a new JSR version, then bump `@sarkarshubhdeep/jerry-lib` in `jerry-cli/deno.json` if needed

```bash
# After testing an override, promote it to jerry-lib
cp ~/.config/jerry/assets/prompts/report.txt \
  /path/to/jerry-lib/assets/prompts/report.txt
```

## Future: org-wide overrides

v1 uses filesystem backends only (local override + shipped defaults). A future MongoDB backend could serve org-wide prompt overrides from a shared database — the layered backend in [jerry-lib `src/assets/index.ts`](https://github.com/SarkarShubhdeep/jerry-lib/blob/main/src/assets/index.ts) is structured to add that without changing the CLI command surface.
