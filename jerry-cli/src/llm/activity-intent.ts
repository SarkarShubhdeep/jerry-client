const DEFAULT_RANGE_HOURS = 8
const MAX_RANGE_HOURS = 168

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

  const pastNHours = lower.match(/past\s+(\d+(?:\.\d+)?)\s*hours?/)
  if (pastNHours) {
    const n = parseFloat(pastNHours[1])
    if (Number.isFinite(n) && n > 0) {
      return Math.min(n, MAX_RANGE_HOURS)
    }
  }

  if (/\blast\s+hour\b/.test(lower) || /\bpast\s+hour\b/.test(lower)) {
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

export function resolveRangeHours(prompt: string, hoursFlag?: number): number {
  if (hoursFlag !== undefined && Number.isFinite(hoursFlag) && hoursFlag > 0) {
    return Math.min(hoursFlag, MAX_RANGE_HOURS)
  }
  return parseActivityRangeHours(prompt)
}
