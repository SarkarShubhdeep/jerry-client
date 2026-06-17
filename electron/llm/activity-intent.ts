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
  'yesterdays',
  'previous day',
  'day before',
]

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
