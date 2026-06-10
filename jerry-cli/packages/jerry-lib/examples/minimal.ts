/**
 * Smoke check: third-party script can import @jerry/lib with zero jerry-cli deps.
 * Run from jerry-cli/: deno check packages/jerry-lib/examples/minimal.ts
 */
import {
  ask,
  generateReport,
  type GenerateReportInput,
  initJerryLib,
  type JerryLlmConfig,
  type LlmStatusPhase,
  type ReportPhase,
} from '@jerry/lib'

initJerryLib()

const config: JerryLlmConfig = { apiKey: '', model: 'gpt-4o-mini' }

const statusPhases: LlmStatusPhase[] = [
  'thinking',
  'web_search_searching',
  'web_search_done',
  'finalizing',
  'done',
]

const reportPhases: ReportPhase[] = ['writing', 'rechecking']

function mapStatus(phase: LlmStatusPhase): string {
  return statusPhases.includes(phase) ? phase : phase
}

function mapReport(phase: ReportPhase): string {
  return reportPhases.includes(phase) ? phase : phase
}

const input: GenerateReportInput = {
  userPrompt: 'today',
  activityContext: '',
  config,
}

// Type-only references — no network calls
export type Smoke =
  | typeof ask
  | typeof generateReport
  | typeof mapStatus
  | typeof mapReport
  | typeof input
