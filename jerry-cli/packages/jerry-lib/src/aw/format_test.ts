import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.13'
import { formatActivityContext } from './format.ts'
import type { AwActivitySummary } from './types.ts'

function mockSummary(overrides: Partial<AwActivitySummary> = {}): AwActivitySummary {
  return {
    connected: true,
    bucketCount: 2,
    rangeHours: 8,
    rangeLabel: 'Today (since local midnight)',
    range: {
      start: '2026-06-10T04:00:00.000Z',
      end: '2026-06-10T12:00:00.000Z',
    },
    afk: { status: 'not-afk', timestamp: '2026-06-10T11:55:00.000Z' },
    latest: [
      {
        watcher: 'window',
        bucketId: 'aw-watcher-window_hostname',
        app: 'Cursor',
        title: 'jerry-client',
        timestamp: '2026-06-10T11:55:00.000Z',
      },
    ],
    topActivities: [
      {
        watcher: 'window',
        app: 'Cursor',
        title: 'jerry-client',
        durationSeconds: 3600,
        eventCount: 42,
      },
    ],
    topWebLinks: [
      {
        url: 'https://github.com/example/repo',
        title: 'example/repo',
        durationSeconds: 900,
        eventCount: 5,
      },
    ],
    meetingSessions: [],
    eventCounts: { window: 42, web: 5 },
    eventFetchPages: { window: 1, web: 1 },
    totalEventCount: 47,
    totalApiCalls: 2,
    ...overrides,
  }
}

Deno.test('formatActivityContext includes range metadata and top activities', () => {
  const context = formatActivityContext(mockSummary())

  assertStringIncludes(context, '## ActivityWatch data (local, read-only)')
  assertStringIncludes(context, 'Today (since local midnight)')
  assertStringIncludes(context, 'Total events in range: 47')
  assertStringIncludes(context, '### Top activities by tracked duration')
  assertStringIncludes(context, '[window] Cursor — jerry-client: 1h')
})

Deno.test('formatActivityContext includes work-related web links', () => {
  const context = formatActivityContext(mockSummary())

  assertStringIncludes(context, '### Work-related web links')
  assertStringIncludes(context, '[example/repo](https://github.com/example/repo)')
})

Deno.test('formatActivityContext handles empty event range', () => {
  const context = formatActivityContext(
    mockSummary({
      totalEventCount: 0,
      topActivities: [],
      topWebLinks: [],
      latest: [],
      eventCounts: {},
    }),
  )

  assertStringIncludes(context, 'No ActivityWatch events were recorded in this time range.')
  assertEquals(context.includes('### Top activities'), false)
})
