/**
 * jerry-lib — pure Jerry engine (LLM + ActivityWatch formatting + a3t prompts).
 *
 * No CLI, no stdout, no Cliffy. Hosts (jerry-cli, Electron, web backend) supply
 * I/O boundaries: config loading, AW HTTP fetches, and user-facing output.
 *
 * Public API groupings below mirror packages/jerry-lib/README.md.
 */

// --- Init ---
export { initJerryLib, type JerryLibInitOptions } from './src/init.ts'

// --- LLM ---
export { ask } from './src/llm/ask.ts'
export { generateReport, recheckReport } from './src/llm/report.ts'

// --- ActivityWatch ---
export { formatActivityContext } from './src/aw/format.ts'
export {
  type ActivityTimeRange,
  formatActivityWindowLog,
  mentionsFullHistory,
  mentionsYesterday,
  resolveActivityRange,
  resolveRangeHours,
} from './src/aw/intent.ts'

// --- Assets (advanced; prefer initJerryLib for prompt setup) ---
export {
  type AssetsInitOptions,
  clearAssetCache,
  getPrompt,
  initAssets,
} from './src/assets/index.ts'

// --- Models ---
export {
  DEFAULT_OPENAI_MODEL,
  isAllowedOpenAiModel,
  OPENAI_MODEL_IDS,
  type OpenAiModelId,
} from './src/llm/models.ts'

// --- Types ---
export type {
  GenerateReportInput,
  JerryLlmConfig,
  RecheckReportInput,
  ReportPhase,
  ReportProgress,
  ReportResult,
} from './src/types.ts'

export type { ChatMessage, ChatResponse, ChatRole, LlmApiPath } from './src/llm/types.ts'
export type { LlmStatusCallback, LlmStatusPhase, LlmStatusUpdate } from './src/llm/status.ts'
export type { AwActivitySummary, Bucket, WatcherKind } from './src/aw/types.ts'
