# @jerry/lib

Host-agnostic Jerry engine: a3t prompt loading, ActivityWatch formatting, and OpenAI calls (`ask`, `generateReport`, `recheckReport`).

No CLI, no stdout, no Cliffy. Hosts (jerry-cli, Electron, headless servers) supply config loading, ActivityWatch HTTP fetches, and user-facing output.

## Import

In the jerry-cli Deno workspace:

```ts
import {
  ask,
  generateReport,
  initJerryLib,
  type JerryLlmConfig,
  type LlmStatusPhase,
  type ReportPhase,
} from '@jerry/lib'
```

Map `@jerry/lib` to `./packages/jerry-lib/mod.ts` in your `deno.json` imports (already configured in this repo).

## `initJerryLib({ assets })`

Call once per process before `ask` or `generateReport`. Prompts auto-initialize with shipped defaults on first use if you skip this.

| Option                | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `assets.overridePath` | User-local directory for prompt overrides (resolved before shipped defaults) |
| `assets.shippedRoot`  | Optional root for bundled prompts; defaults to `packages/jerry-lib/assets/`  |

### Host examples

```ts
import { join } from 'node:path'
import { homedir } from 'node:os'
import { initJerryLib } from '@jerry/lib'

// CLI host (~/.config/jerry/assets)
initJerryLib({
  assets: { overridePath: join(homedir(), '.config/jerry/assets') },
})

// Electron host (app userData)
// import { app } from 'electron'
initJerryLib({
  assets: { overridePath: join(app.getPath('userData'), 'assets') },
})

// Headless server (shipped defaults only)
initJerryLib()
```

## Usage

The host supplies `JerryLlmConfig` (API key and model). The library never reads environment variables.

```ts
import { ask, generateReport, type JerryLlmConfig } from '@jerry/lib'

const config: JerryLlmConfig = {
  apiKey: process.env.OPENAI_API_KEY ?? '',
  model: 'gpt-4o-mini',
}

// Ask (no ActivityWatch)
const answer = await ask('What is Deno?', config, (update) => {
  // Map update.phase to UI copy; update.label is omitted by the library
  console.log(update.phase, update.durationMs)
})

// Report (host fetches AW and formats context first)
const result = await generateReport(
  {
    userPrompt: 'Summarize my work yesterday',
    activityContext: formattedAwBlock,
    config,
  },
  (phase) => {
    // phase is 'writing' | 'rechecking'
    console.log(phase)
  },
)
```

## Progress and status

Hosts own all user-facing labels.

### Report phases (`ReportPhase`)

| Phase        | Typical host label             |
| ------------ | ------------------------------ |
| `writing`    | Writing work narrative…        |
| `rechecking` | Rechecking the work narrative… |

### Ask status phases (`LlmStatusPhase`)

| Phase                  | Typical host label              |
| ---------------------- | ------------------------------- |
| `thinking`             | Thinking…                       |
| `web_search_searching` | Searching web…                  |
| `web_search_done`      | Searched web (use `durationMs`) |
| `finalizing`           | Finalizing answer…              |
| `done`                 | Done                            |

## Public API

Mirrors [`mod.ts`](./mod.ts).

### Init

| Export                | Kind     |
| --------------------- | -------- |
| `initJerryLib`        | function |
| `JerryLibInitOptions` | type     |

### LLM

| Export           | Kind     |
| ---------------- | -------- |
| `ask`            | function |
| `generateReport` | function |
| `recheckReport`  | function |

### ActivityWatch

| Export                    | Kind     |
| ------------------------- | -------- |
| `formatActivityContext`   | function |
| `resolveActivityRange`    | function |
| `resolveRangeHours`       | function |
| `formatActivityWindowLog` | function |
| `mentionsYesterday`       | function |
| `mentionsFullHistory`     | function |
| `ActivityTimeRange`       | type     |

### Assets (advanced)

Prefer `initJerryLib` for setup. These are escape hatches for custom prompt keys or cache control.

| Export              | Kind     |
| ------------------- | -------- |
| `initAssets`        | function |
| `getPrompt`         | function |
| `clearAssetCache`   | function |
| `AssetsInitOptions` | type     |

### Models

| Export                 | Kind     |
| ---------------------- | -------- |
| `DEFAULT_OPENAI_MODEL` | const    |
| `OPENAI_MODEL_IDS`     | const    |
| `isAllowedOpenAiModel` | function |
| `OpenAiModelId`        | type     |

### Types

| Export                | Kind |
| --------------------- | ---- |
| `JerryLlmConfig`      | type |
| `ReportPhase`         | type |
| `ReportProgress`      | type |
| `GenerateReportInput` | type |
| `RecheckReportInput`  | type |
| `ReportResult`        | type |
| `ChatMessage`         | type |
| `ChatResponse`        | type |
| `ChatRole`            | type |
| `LlmApiPath`          | type |
| `LlmStatusCallback`   | type |
| `LlmStatusPhase`      | type |
| `LlmStatusUpdate`     | type |
| `AwActivitySummary`   | type |
| `Bucket`              | type |
| `WatcherKind`         | type |

## Check

```bash
deno task check:lib
```
