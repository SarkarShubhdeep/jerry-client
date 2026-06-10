import type { LlmStatusUpdate, ReportPhase } from '@jerry/lib'

export function labelForLlmStatus(update: LlmStatusUpdate): string | undefined {
  if (update.label) return update.label

  switch (update.phase) {
    case 'thinking':
      return 'Thinking…'
    case 'web_search_searching':
      return 'Searching web…'
    case 'web_search_done': {
      if (!update.durationMs || update.durationMs < 1000) return 'Searched web'
      const seconds = Math.max(1, Math.round(update.durationMs / 1000))
      return `Searched web for ${seconds}s`
    }
    case 'finalizing':
      return 'Finalizing answer…'
    case 'done':
      return 'Done'
    default:
      return undefined
  }
}

export function labelForReportPhase(phase: ReportPhase): string {
  switch (phase) {
    case 'writing':
      return 'Writing work narrative…'
    case 'rechecking':
      return 'Rechecking the work narrative…'
  }
}
