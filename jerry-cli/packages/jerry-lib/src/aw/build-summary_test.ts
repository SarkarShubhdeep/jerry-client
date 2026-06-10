import { assertEquals } from 'jsr:@std/assert@^1.0.13'
import { buildActivitySummary } from './build-summary.ts'
import type { ActivityTimeRange } from './intent.ts'
import type { Bucket, RawEvent } from './types.ts'

const range: ActivityTimeRange = {
  start: new Date('2026-06-10T08:00:00.000Z'),
  end: new Date('2026-06-10T10:00:00.000Z'),
  label: 'Test window',
}

const buckets: Bucket[] = [
  { id: 'aw-watcher-window_testhost', type: 'currentwindow' },
  { id: 'aw-watcher-web_testhost', type: 'web.tab.current' },
]

const windowEvents: RawEvent[] = [
  {
    timestamp: '2026-06-10T08:30:00.000Z',
    duration: 1800,
    data: { app: 'Cursor', title: 'jerry-client' },
  },
  {
    timestamp: '2026-06-10T09:00:00.000Z',
    duration: 600,
    data: { app: 'Terminal', title: 'zsh' },
  },
]

const webEvents: RawEvent[] = [
  {
    timestamp: '2026-06-10T08:45:00.000Z',
    duration: 300,
    data: {
      url: 'https://github.com/example/repo',
      title: 'example/repo',
    },
  },
]

Deno.test('buildActivitySummary aggregates events from mock buckets', () => {
  const summary = buildActivitySummary(
    buckets,
    {
      'aw-watcher-window_testhost': windowEvents,
      'aw-watcher-web_testhost': webEvents,
    },
    {
      'aw-watcher-window_testhost': 1,
      'aw-watcher-web_testhost': 1,
    },
    range,
    { hostname: 'testhost' },
  )

  assertEquals(summary.connected, true)
  assertEquals(summary.rangeLabel, 'Test window')
  assertEquals(summary.totalEventCount, 3)
  assertEquals(summary.eventCounts.window, 2)
  assertEquals(summary.eventCounts.web, 1)
  assertEquals(summary.topActivities.length > 0, true)
  assertEquals(summary.topWebLinks.length, 1)
  assertEquals(summary.topWebLinks[0].url, 'https://github.com/example/repo')
  assertEquals(summary.latest.length, 2)
})

Deno.test('buildActivitySummary filters events outside range', () => {
  const outOfRange: RawEvent[] = [
    {
      timestamp: '2026-06-09T08:00:00.000Z',
      duration: 3600,
      data: { app: 'Old', title: 'stale' },
    },
  ]

  const summary = buildActivitySummary(
    buckets,
    {
      'aw-watcher-window_testhost': outOfRange,
      'aw-watcher-web_testhost': [],
    },
    {
      'aw-watcher-window_testhost': 1,
      'aw-watcher-web_testhost': 0,
    },
    range,
    { hostname: 'testhost' },
  )

  assertEquals(summary.totalEventCount, 0)
  assertEquals(summary.topActivities.length, 0)
})
