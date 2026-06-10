/**
 * jerry-lib — pure Jerry engine (LLM + ActivityWatch formatting + a3t prompts).
 *
 * No CLI, no stdout, no Cliffy. Hosts (jerry-cli, Electron, web backend) supply
 * I/O boundaries: config loading, AW HTTP fetches, and user-facing output.
 */

export { initJerryLib, type JerryLibInitOptions } from './src/init.ts'

export { ask } from './src/llm/ask.ts'
export { generateReport, recheckReport } from './src/llm/report.ts'

export { formatActivityContext } from './src/aw/format.ts'
export {
  resolveActivityRange,
  resolveRangeHours,
  formatActivityWindowLog,
  mentionsYesterday,
  mentionsFullHistory,
  type ActivityTimeRange,
} from './src/aw/intent.ts'

export { initAssets, getPrompt, clearAssetCache, type AssetsInitOptions } from './src/assets/index.ts'

export {
  DEFAULT_OPENAI_MODEL,
  OPENAI_MODEL_IDS,
  isAllowedOpenAiModel,
  type OpenAiModelId,
} from './src/llm/models.ts'

export type {
  JerryLlmConfig,
  ReportProgress,
  GenerateReportInput,
  RecheckReportInput,
  ReportResult,
} from './src/types.ts'

export type { ChatMessage, ChatResponse, ChatRole, LlmApiPath } from './src/llm/types.ts'
export type { LlmStatusCallback, LlmStatusPhase, LlmStatusUpdate } from './src/llm/status.ts'
export type { AwActivitySummary, Bucket, WatcherKind } from './src/aw/types.ts'
