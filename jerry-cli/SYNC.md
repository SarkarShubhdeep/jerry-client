# Sync map

`@sarkarshubhdeep/jerry-lib` (JSR) is the **engine**. jerry-cli and Electron are **host adapters** — they fetch ActivityWatch over HTTP, load config, and call lib APIs.

| Host concern | jerry-cli | Electron |
|--------------|-----------|----------|
| AW HTTP | `jerry-cli/src/aw/client.ts` | `electron/aw/client.ts` |
| AW types | re-export from lib | `electron/aw/types.ts` re-export from lib |
| Activity intent glue | `needsActivityContext` in CLI report flow | `electron/llm/activity-intent.ts` |
| LLM orchestration | lib `ask` / `generateReport` | `electron/llm/chat-host.ts` |
| Config | `jerry-cli/src/config.ts` (env + cli.json) | `electron/store/settings.ts` (electron-store) |
| Prompt overrides | `~/.config/jerry/assets/` | `{userData}/assets/` via `initJerryLib` |
| Status labels | `jerry-cli/src/llm-labels.ts` | `electron/llm/chat-host.ts` + `electron/llm/status.ts` |

**Not in hosts:** aggregation, date/range parsing, prompt strings, model allowlists, OpenAI client — all in jerry-lib.

## Prompt assets

Shipped defaults are bundled in [@sarkarshubhdeep/jerry-lib](https://jsr.io/@sarkarshubhdeep/jerry-lib). Hosts call `initJerryLib({ assets: { overridePath } })` once at startup. See [docs/a3t-usage.md](../docs/a3t-usage.md).

## Historical note

Before Phase 5 (#33), jerry-cli logic was copied from `electron/`. Electron now imports the same lib as jerry-cli; keep HTTP clients in sync manually.
