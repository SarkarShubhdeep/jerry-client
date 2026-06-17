# Changelog

All notable changes to the Jerry desktop app are documented here.

## [0.2.0] — 2026-06-17

### Changed

- **Electron main process adopts [@sarkarshubhdeep/jerry-lib](https://jsr.io/@sarkarshubhdeep/jerry-lib)** from JSR — ActivityWatch aggregation, prompts (a3t), and LLM orchestration now live in the shared library instead of duplicated `electron/` code.
- Jerry badge and about panel updated to **v0.2**.

### Removed

- Duplicated engine modules from Electron: `electron/aw/aggregate.ts`, `electron/llm/prompt.ts`, `models.ts`, `activity-dates.ts`, `activity-context.ts`.

### Added

- `electron/jerry-lib-runtime.ts` — dynamic JSR import + `initJerryLib` with `{userData}/assets` prompt overrides.
- `electron/llm/chat-host.ts` — thin host routing to lib `ask` (general chat) and `generateReport` (ActivityWatch narratives).
- `electron/README.md` — host adapter docs pointing to jerry-lib integration guides.
- `.npmrc` for JSR registry (`@jsr:registry=https://npm.jsr.io`).

### Developer notes

- Chat uses single-turn lib APIs per send (last user message + fresh AW context when activity phrases are detected).
- Prompt overrides: `{userData}/assets/prompts/` — see [a3t-prompts.md](https://github.com/SarkarShubhdeep/jerry-lib/blob/main/docs/a3t-prompts.md).
- jerry-cli and Electron are now parallel host adapters; see `jerry-cli/SYNC.md`.

Closes #33.

## [0.1.0] — beta

- Initial macOS Electron app: chat UI, ActivityWatch integration, OpenAI work narratives, settings store, unsigned `.dmg` releases.
