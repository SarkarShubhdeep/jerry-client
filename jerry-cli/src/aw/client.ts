import os from 'node:os'
import {
  buildActivitySummary,
  pickBucket,
  type ActivityTimeRange,
} from '@jerry/lib'
import type { AwActivityResult, Bucket, RawEvent, WatcherKind } from './types.ts'

const DEFAULT_BASE_URL = 'http://localhost:5600/api/0'
const WATCHERS: WatcherKind[] = ['window', 'web', 'vscode', 'afk']

export const EVENT_PAGE_SIZE = 1000
const MAX_PAGES_PER_BUCKET = 50

function baseUrl(): string {
  const url = Deno.env.get('ACTIVITYWATCH_BASE_URL') || DEFAULT_BASE_URL
  return url.replace(/\/+$/, '')
}

async function awFetch(path: string, timeoutMs = 8_000): Promise<Response> {
  const url = `${baseUrl()}${path}`
  return await fetch(url, {
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
  limit: number = EVENT_PAGE_SIZE,
): Promise<RawEvent[]> {
  const params = new URLSearchParams({
    start,
    end,
    limit: String(limit),
  })
  const res = await awFetch(
    `/buckets/${encodeURIComponent(bucketId)}/events?${params}`,
    30_000,
  )
  if (!res.ok) {
    throw new Error(`ActivityWatch events request failed (${res.status})`)
  }
  return (await res.json()) as RawEvent[]
}

function oldestTimestamp(events: readonly RawEvent[]): string {
  return events.reduce((oldest, e) => {
    return new Date(e.timestamp).getTime() < new Date(oldest).getTime() ? e.timestamp : oldest
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
  end: string,
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
        ...all.map((e) => new Date(e.timestamp).getTime()),
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

export type ActivityFetchRange = ActivityTimeRange

export async function fetchActivitySummary(
  range: ActivityFetchRange,
): Promise<AwActivityResult> {
  const startIso = range.start.toISOString()
  const endIso = range.end.toISOString()

  try {
    const buckets = await listActivityWatchBuckets()
    if (buckets.length === 0) {
      return { connected: false, error: 'No ActivityWatch buckets found. Is a watcher running?' }
    }

    const hostname = os.hostname()
    const eventsByBucket: Record<string, RawEvent[]> = {}
    const pagesByBucket: Record<string, number> = {}

    await Promise.all(
      WATCHERS.map(async (watcher) => {
        const bucket = pickBucket(buckets, watcher, hostname)
        if (!bucket) return

        const { events, pages } = await fetchAllEventsInRange(
          bucket.id,
          startIso,
          endIso,
        )
        eventsByBucket[bucket.id] = events
        pagesByBucket[bucket.id] = pages
      }),
    )

    return buildActivitySummary(
      buckets,
      eventsByBucket,
      pagesByBucket,
      range,
      { hostname },
    )
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
