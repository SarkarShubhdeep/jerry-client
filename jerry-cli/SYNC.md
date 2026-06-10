# Sync map (copied from Jerry Client desktop)

Logic in `jerry-cli/src/` was copied from the Electron main process for an **independent** CLI experiment. The desktop app does **not** import this package. Reconcile manually when you want parity.

| jerry-cli | Source (jerry-client @ `2341949`) |
|-----------|-----------------------------------|
| `src/aw/types.ts` | `electron/aw/types.ts` |
| `src/aw/aggregate.ts` | `electron/aw/aggregate.ts` |
| `src/aw/client.ts` | `electron/aw/client.ts` |
| `src/llm/activity-intent.ts` | `electron/llm/activity-intent.ts` (trimmed; added `past hour`) |
| `src/llm/activity-context.ts` | `electron/llm/activity-context.ts` |
| `src/llm/models.ts` | `electron/llm/models.ts` |
| `src/llm/types.ts` | `electron/llm/types.ts` (completions only) |
| `src/llm/prompt.ts` | `electron/llm/prompt.ts` (CLI-specific wording; loads a3t assets, not inline strings) |
| `src/llm/client.ts` | `electron/llm/client.ts` (rewritten: env config, no web search, single-turn) |
| `assets/prompts/*` | not copied from desktop (a3t-managed shipped defaults) |

**Not copied:** IPC, preload, `electron/store/settings.ts`, `electron/llm/status.ts`, Responses API / web search.

## Prompt assets

CLI prompts are **a3t-managed** under `jerry-cli/assets/prompts/` (`ask.txt`, `report.txt`, `recheck.txt`). They are no longer synced line-by-line from `electron/llm/prompt.ts`.

The desktop app still uses inline prompts in `electron/llm/prompt.ts`. Consider adopting a3t there later for parity. See [docs/a3t-usage.md](../docs/a3t-usage.md).
