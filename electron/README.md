# Electron main process

Thin **host adapter** for the Jerry desktop app. Engine logic (ActivityWatch aggregation, prompts, LLM orchestration) lives in [@sarkarshubhdeep/jerry-lib](https://jsr.io/@sarkarshubhdeep/jerry-lib).

## Canonical docs

- [host-integration.md](https://github.com/SarkarShubhdeep/jerry-lib/blob/main/docs/host-integration.md) — responsibility split, 7-step host pipeline
- [a3t-prompts.md](https://github.com/SarkarShubhdeep/jerry-lib/blob/main/docs/a3t-prompts.md) — prompt overrides in `{userData}/assets/prompts/`
- [JSR API](https://jsr.io/@sarkarshubhdeep/jerry-lib/doc)

## What Electron owns

| Module | Role |
|--------|------|
| `main.ts` | Window lifecycle, `initJerryLib` |
| `ipc/` | Renderer IPC bridge |
| `store/settings.ts` | `JerryLlmConfig` from electron-store |
| `aw/client.ts` | ActivityWatch HTTP fetch only |
| `llm/chat-host.ts` | Routes chat to lib `ask` / `generateReport` |
| `llm/status.ts` | UI status label mapping |

## Reference adapter

[jerry-cli](../jerry-cli/) is the other Jerry host adapter. Both consume the same JSR package.
