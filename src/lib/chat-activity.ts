import type { ChatActivityStep } from '@/components/chat-activity'
import type { LlmStatusUpdate } from '@/types/llm'

export function applyStatusUpdate(
  steps: ChatActivityStep[],
  update: LlmStatusUpdate
): ChatActivityStep[] {
  const next = steps.map((s) =>
    s.state === 'active' ? { ...s, state: 'done' as const } : s
  )

  switch (update.phase) {
    case 'thinking':
      return upsertStep(next, 'thinking', update.label, 'active')
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
      return next.map((s) => ({ ...s, state: 'done' as const }))
    default:
      return next
  }
}

function upsertStep(
  steps: ChatActivityStep[],
  phase: ChatActivityStep['phase'],
  label: string,
  state: ChatActivityStep['state']
): ChatActivityStep[] {
  const index = steps.findIndex((s) => s.phase === phase)
  const step: ChatActivityStep = { phase, label, state }
  if (index === -1) return [...steps, step]
  const copy = [...steps]
  copy[index] = step
  return copy
}
