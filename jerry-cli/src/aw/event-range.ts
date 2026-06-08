import type { RawEvent } from './types.ts'

/** Keep only events whose timestamp falls in [start, end). */
export function filterEventsInRange(
  events: readonly RawEvent[],
  startIso: string,
  endIso: string,
): RawEvent[] {
  const startMs = new Date(startIso).getTime()
  const endMs = new Date(endIso).getTime()
  return events.filter((e) => {
    const t = new Date(e.timestamp).getTime()
    return t >= startMs && t < endMs
  })
}
