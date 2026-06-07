import os from 'node:os'
import {
  aggregateMeetingSessions,
  aggregateTopActivities,
  aggregateTopWebLinks,
  mergeTopActivities,
} from './aggregate.ts'
import { filterEventsInRange } from './event-range.ts'
import type {
  AwActivityResult,
  Bucket,
  LatestWatcherEvent,
  RawEvent,
  TopActivity,
  MeetingSession,
  WebLinkActivity,
  WatcherKind,
} from './types.ts'

const DEFAULT_BASE_URL = 'http://localhost:5600/api/0'
const WATCHERS: WatcherKind[] = ['window', 'web', 'vscode', 'afk']

export const EVENT_PAGE_SIZE = 1000
const MAX_PAGES_PER_BUCKET = 50

function baseUrl(): string {
  const url = Deno.env.get('ACTIVITYWATCH_BASE_URL') || DEFAULT_BASE_URL
  return url.replace(/\/+$/, '')
}

export function watcherFromBucketId(bucketId: string): WatcherKind {
  const id = bucketId.toLowerCase()
  if (id.includes('aw-watcher-window')) return 'window'
  if (id.includes('aw-watcher-web')) return 'web'
  if (id.includes('aw-watcher-vscode')) return 'vscode'
  if (id.includes('aw-watcher-afk')) return 'afk'
  return 'other'
}

async function awFetch(path: string, timeoutMs = 8_000): Promise<Response> {
  const url = `${baseUrl()}${path}`
  return fetch(url, {
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })
}

export type AwConnectionStatus = {
  connected: boolean
  error?: string
}

export async function checkActivityWatchConnection(): Promise<AwConnectionStatus> {
  try {
    const res = await awFetch('/buckets', 3_000)
    if (!res.ok) {
      return {
        connected: false,
        error: `ActivityWatch returned ${res.status}`,
      }
    }
    const body = (await res.json()) as Record<string, Bucket>
    if (Object.keys(body).length === 0) {
      return {
        connected: false,
        error: 'No ActivityWatch buckets found. Is a watcher running?',
      }
    }
    return { connected: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      return {
        connected: false,
        error: `ActivityWatch is not reachable at ${baseUrl()}`,
      }
    }
    return { connected: false, error: message }
  }
}

export async function listActivityWatchBuckets(): Promise<Bucket[]> {
  const res = await awFetch('/buckets/')
  if (!res.ok) {
    throw new Error(`ActivityWatch buckets request failed (${res.status})`)
  }
  const body = (await res.json()) as Record<string, Bucket>
  return Object.entries(body).map(([id, b]) => ({
    id,
    type: b.type,
    client: b.client,
    hostname: b.hostname,
    created: b.created,
    last_updated: b.last_updated,
  }))
}

async function fetchEventsPage(
  bucketId: string,
  start: string,
  end: string,
  limit: number = EVENT_PAGE_SIZE
): Promise<RawEvent[]> {
  const params = new URLSearchParams({
    start,
    end,
    limit: String(limit),
  })
  const res = await awFetch(
    `/buckets/${encodeURIComponent(bucketId)}/events?${params}`,
    30_000
  )
  if (!res.ok) {
    throw new Error(`ActivityWatch events request failed (${res.status})`)
  }
  return (await res.json()) as RawEvent[]
}

function oldestTimestamp(events: readonly RawEvent[]): string {
  return events.reduce((oldest, e) => {
    return new Date(e.timestamp).getTime() < new Date(oldest).getTime()
      ? e.timestamp
      : oldest
  }, events[0].timestamp)
}

function endBeforeTimestamp(iso: string): string {
  return new Date(new Date(iso).getTime() - 1).toISOString()
}

export type PaginatedFetchResult = {
  events: RawEvent[]
  pages: number
}

export async function fetchAllEventsInRange(
  bucketId: string,
  start: string,
  end: string
): Promise<PaginatedFetchResult> {
  const all: RawEvent[] = []
  let rangeEnd = end
  let pages = 0

  while (pages < MAX_PAGES_PER_BUCKET) {
    const batch = await fetchEventsPage(bucketId, start, rangeEnd, EVENT_PAGE_SIZE)
    pages += 1

    if (batch.length === 0) break

    let page = batch
    if (all.length > 0) {
      const oldestMs = Math.min(
        ...all.map((e) => new Date(e.timestamp).getTime())
      )
      page = batch.filter((e) => new Date(e.timestamp).getTime() < oldestMs)
    }
    if (page.length === 0) break

    all.push(...page)

    if (batch.length < EVENT_PAGE_SIZE) break

    const previousEnd = rangeEnd
    rangeEnd = endBeforeTimestamp(oldestTimestamp(batch))

    if (rangeEnd >= previousEnd) break
    if (new Date(rangeEnd).getTime() <= new Date(start).getTime()) break
  }

  return { events: all, pages }
}

function pickBucket(buckets: Bucket[], watcher: WatcherKind): Bucket | undefined {
  const matches = buckets.filter((b) => watcherFromBucketId(b.id) === watcher)
  if (matches.length === 0) return undefined

  const hostname = os.hostname()
  const hostMatch = matches.find(
    (b) => b.id.includes(hostname) || b.hostname === hostname
  )
  return hostMatch ?? matches[0]
}

function labelFromEvent(e: RawEvent, watcher: WatcherKind): { app: string; title: string } {
  const data = e.data ?? {}
  if (watcher === 'afk') {
    const status =
      typeof data.status === 'string' ? data.status : 'unknown'
    return { app: 'afk', title: status }
  }
  const app =
    (typeof data.app === 'string' && data.app) ||
    (typeof data.title === 'string' && data.title) ||
    'Unknown'
  const title =
    (typeof data.title === 'string' && data.title) ||
    (typeof data.url === 'string' && data.url) ||
    ''
  return { app, title }
}

function newestEvent(events: RawEvent[]): RawEvent | undefined {
  if (events.length === 0) return undefined
  return events.reduce((newest, e) =>
    new Date(e.timestamp).getTime() > new Date(newest.timestamp).getTime() ? e : newest
  )
}

export type ActivityFetchRange = {
  start: Date
  end: Date
  label: string
}

export async function fetchActivitySummary(
  range: ActivityFetchRange
): Promise<AwActivityResult> {
  const start = range.start
  const end = range.end
  const hours = Math.max((end.getTime() - start.getTime()) / (60 * 60 * 1000), 0.25)
  const startIso = start.toISOString()
  const endIso = end.toISOString()

  try {
    const buckets = await listActivityWatchBuckets()
    if (buckets.length === 0) {
      return { connected: false, error: 'No ActivityWatch buckets found. Is a watcher running?' }
    }

    const latest: LatestWatcherEvent[] = []
    const perWatcherTop: TopActivity[] = []
    let topWebLinks: WebLinkActivity[] = []
    let meetingSessions: MeetingSession[] = []
    const eventCounts: Partial<Record<WatcherKind, number>> = {}
    const eventFetchPages: Partial<Record<WatcherKind, number>> = {}
    let afk: { status: string; timestamp: string } | null = null
    let totalApiCalls = 0

    await Promise.all(
      WATCHERS.map(async (watcher) => {
        const bucket = pickBucket(buckets, watcher)
        if (!bucket) return

        const { events: rawEvents, pages } = await fetchAllEventsInRange(
          bucket.id,
          startIso,
          endIso
        )
        const events = filterEventsInRange(rawEvents, startIso, endIso)
        totalApiCalls += pages
        eventCounts[watcher] = events.length
        eventFetchPages[watcher] = pages

        perWatcherTop.push(...aggregateTopActivities(events, watcher))
        if (watcher === 'web') {
          topWebLinks = aggregateTopWebLinks(events)
          meetingSessions = aggregateMeetingSessions(events)
        }

        const newest = newestEvent(events)
        if (!newest) return

        const { app, title } = labelFromEvent(newest, watcher)
        latest.push({
          watcher,
          bucketId: bucket.id,
          app,
          title,
          timestamp: newest.timestamp,
        })

        if (watcher === 'afk') {
          afk = { status: title, timestamp: newest.timestamp }
        }
      })
    )

    const topActivities = mergeTopActivities(perWatcherTop)

    latest.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const totalEventCount = Object.values(eventCounts).reduce(
      (sum, n) => sum + (n ?? 0),
      0
    )

    return {
      connected: true,
      bucketCount: buckets.length,
      rangeHours: hours,
      rangeLabel: range.label,
      range: { start: startIso, end: endIso },
      afk,
      latest,
      topActivities,
      topWebLinks,
      meetingSessions,
      eventCounts,
      eventFetchPages,
      totalEventCount,
      totalApiCalls,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('fetch failed') || message.includes('ECONNREFUSED')) {
      return {
        connected: false,
        error: `ActivityWatch is not reachable at ${baseUrl()}. Start ActivityWatch and try again.`,
      }
    }
    return { connected: false, error: message }
  }
}
