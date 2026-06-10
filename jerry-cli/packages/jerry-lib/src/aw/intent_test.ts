import { assertEquals, assertThrows } from 'jsr:@std/assert@^1.0.13'
import { resolveActivityRange, resolveRangeHours } from './intent.ts'
import type { Bucket } from './types.ts'

const mockBuckets: Bucket[] = [
  {
    id: 'aw-watcher-window_testhost',
    created: '2026-01-01T00:00:00.000Z',
  },
]

Deno.test('resolveActivityRange parses today from prompt', () => {
  const range = resolveActivityRange('today', undefined, mockBuckets)

  assertEquals(range.label, 'Today (since local midnight)')
  assertEquals(range.start.getHours(), 0)
  assertEquals(range.start.getMinutes(), 0)
  assertEquals(range.end.getTime() >= range.start.getTime(), true)
})

Deno.test('resolveActivityRange parses yesterday from prompt', () => {
  const range = resolveActivityRange('yesterday', undefined, mockBuckets)

  assertEquals(range.label, 'Yesterday (full calendar day, local time)')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  assertEquals(range.end.getTime(), todayStart.getTime())
})

Deno.test('resolveActivityRange honors --hours flag', () => {
  const before = Date.now()
  const range = resolveActivityRange('anything', 2, mockBuckets)
  const after = Date.now()

  assertEquals(range.label, 'Last 2 hours (--hours)')
  assertEquals(range.end.getTime() >= before, true)
  assertEquals(range.end.getTime() <= after + 1000, true)

  const spanHours = (range.end.getTime() - range.start.getTime()) / (60 * 60 * 1000)
  assertEquals(Math.round(spanHours * 100) / 100, 2)
})

Deno.test('resolveActivityRange throws when no time range in prompt', () => {
  assertThrows(
    () => resolveActivityRange('what did I work on', undefined, mockBuckets),
    Error,
    'time range',
  )
})

Deno.test('resolveRangeHours returns span for resolved range', () => {
  const hours = resolveRangeHours('last 3 hours', undefined, mockBuckets)
  assertEquals(hours, 3)
})
