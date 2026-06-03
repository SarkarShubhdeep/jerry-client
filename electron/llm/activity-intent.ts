import type { ChatMessage } from './types'

const ACTIVITY_PHRASES = [
  'activitywatch',
  'activity watch',
  'working on',
  'work on',
  'been doing',
  'spent time',
  'focus time',
  'what did i',
  'what have i',
  'what was i',
  'what am i',
  'summarize my',
  'summary of my',
  'my activity',
  'my work',
  'tracked apps',
  'which apps',
  'what apps',
  'this morning',
  'this afternoon',
  'this evening',
  'last hour',
  'today',
  'yesterday',
]

const DEFAULT_RANGE_HOURS = 8
const MAX_RANGE_HOURS = 168

export function lastUserMessage(messages: ChatMessage[]): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content
    }
  }
  return null
}

export function needsActivityContext(text: string): boolean {
  const lower = text.toLowerCase()
  return ACTIVITY_PHRASES.some((phrase) => lower.includes(phrase))
}

function hoursSinceLocalMidnight(): number {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(0, 0, 0, 0)
  const hours = (now.getTime() - midnight.getTime()) / (60 * 60 * 1000)
  return Math.min(Math.max(hours, 0.25), 24)
}

export function parseActivityRangeHours(text: string): number {
  const lower = text.toLowerCase()

  const lastNHours = lower.match(/last\s+(\d+(?:\.\d+)?)\s*hours?/)
  if (lastNHours) {
    const n = parseFloat(lastNHours[1])
    if (Number.isFinite(n) && n > 0) {
      return Math.min(n, MAX_RANGE_HOURS)
    }
  }

  if (/\blast\s+hour\b/.test(lower)) {
    return 1
  }

  if (/\btoday\b/.test(lower) || /\bsince\s+morning\b/.test(lower)) {
    return hoursSinceLocalMidnight()
  }

  if (/\byesterday\b/.test(lower)) {
    return 24
  }

  if (/\bthis\s+morning\b/.test(lower) || /\bthis\s+afternoon\b/.test(lower)) {
    return hoursSinceLocalMidnight()
  }

  return DEFAULT_RANGE_HOURS
}
