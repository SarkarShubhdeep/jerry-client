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
| `src/llm/prompt.ts` | `electron/llm/prompt.ts` (CLI-specific wording) |
| `src/llm/client.ts` | `electron/llm/client.ts` (rewritten: env config, no web search, single-turn) |

**Not copied:** IPC, preload, `electron/store/settings.ts`, `electron/llm/status.ts`, Responses API / web search.
