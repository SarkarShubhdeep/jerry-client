import type { ChatActivityStep } from '@/components/chat-activity'
import type { LlmStatusUpdate } from '@/types/llm'

function formatThoughtDuration(durationMs: number): string {
  if (durationMs < 1000) {
    return 'Thought for a moment'
  }
  const seconds = Math.max(1, Math.round(durationMs / 1000))
  return `Thought for ${seconds}s`
}

function finalizeActiveSteps(steps: ChatActivityStep[]): ChatActivityStep[] {
  const now = Date.now()
  return steps.map((step) => {
    if (step.state !== 'active') {
      return step
    }
    if (step.phase === 'thinking' && step.startedAt != null) {
      return {
        ...step,
        state: 'done',
        label: formatThoughtDuration(now - step.startedAt),
      }
    }
    return { ...step, state: 'done' }
  })
}

export function applyStatusUpdate(
  steps: ChatActivityStep[],
  update: LlmStatusUpdate
): ChatActivityStep[] {
  const next = finalizeActiveSteps(steps)

  switch (update.phase) {
    case 'fetching_activity':
      return upsertStep(next, 'fetching_activity', update.label, 'active', Date.now())
    case 'thinking':
      return upsertStep(next, 'thinking', update.label, 'active', Date.now())
    case 'web_search_searching':
      return upsertStep(next, 'web_search_searching', update.label, 'active')
    case 'web_search_done':
      return upsertStep(
        next.filter((s) => s.phase !== 'web_search_searching'),
        'web_search_done',
        update.label,
        'done'
      )
    case 'finalizing':
      return upsertStep(next, 'finalizing', update.label, 'active')
    case 'done':
      return finalizeActiveSteps(next.map((s) => ({ ...s, state: 'done' as const })))
    default:
      return next
  }
}

function upsertStep(
  steps: ChatActivityStep[],
  phase: ChatActivityStep['phase'],
  label: string,
  state: ChatActivityStep['state'],
  startedAt?: number
): ChatActivityStep[] {
  const index = steps.findIndex((s) => s.phase === phase)
  const step: ChatActivityStep = { phase, label, state, startedAt }
  if (index === -1) return [...steps, step]
  const copy = [...steps]
  const existing = steps[index]
  copy[index] = {
    ...step,
    startedAt:
      state === 'active'
        ? (existing.startedAt ?? startedAt)
        : existing.startedAt,
  }
  return copy
}
