/**
 * Smoke check: third-party script can import @jerry/lib with zero jerry-cli deps.
 * Run from jerry-cli/: deno check packages/jerry-lib/examples/minimal.ts
 */
import {
  ask,
  buildActivitySummary,
  formatActivityContext,
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

const mockBuckets = [{ id: 'aw-watcher-window_hostname' }]
const mockEvents = {
  'aw-watcher-window_hostname': [{
    timestamp: '2026-06-10T10:00:00.000Z',
    duration: 120,
    data: { app: 'Cursor', title: 'minimal.ts' },
  }],
}
const mockRange = {
  start: new Date('2026-06-10T09:00:00.000Z'),
  end: new Date('2026-06-10T12:00:00.000Z'),
  label: 'Smoke test range',
}

const summary = buildActivitySummary(mockBuckets, mockEvents, { 'aw-watcher-window_hostname': 1 }, mockRange)
const formattedContext = formatActivityContext(summary)

// Type-only references — no network calls
export type Smoke =
  | typeof ask
  | typeof generateReport
  | typeof mapStatus
  | typeof mapReport
  | typeof input
  | typeof formattedContext
