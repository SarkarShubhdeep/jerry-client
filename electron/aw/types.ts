export type WatcherKind = 'window' | 'web' | 'vscode' | 'afk' | 'other'

export type Bucket = {
  id: string
  type?: string
  client?: string
  hostname?: string
  created?: string
  last_updated?: string
}

export type RawEvent = {
  timestamp: string
  duration: number
  data: Record<string, unknown>
}

export type LatestWatcherEvent = {
  watcher: WatcherKind
  bucketId: string
  app: string
  title: string
  timestamp: string
}

export type TopActivity = {
  watcher: WatcherKind
  app: string
  title: string
  durationSeconds: number
  eventCount: number
}

/** Work-related page from the AW web watcher, ranked by time on page. */
export type WebLinkActivity = {
  url: string
  title: string
  durationSeconds: number
  eventCount: number
}

export type AwActivitySummary = {
  connected: true
  bucketCount: number
  rangeHours: number
  rangeLabel?: string
  range: { start: string; end: string }
  afk: { status: string; timestamp: string } | null
  latest: LatestWatcherEvent[]
  /** Top apps/titles by summed event duration in the fetched range. */
  topActivities: TopActivity[]
  /** GitHub, docs, and other work-related URLs from the web watcher. */
  topWebLinks: WebLinkActivity[]
  eventCounts: Partial<Record<WatcherKind, number>>
  /** AW API calls per watcher (1000 events per page). */
  eventFetchPages: Partial<Record<WatcherKind, number>>
  totalEventCount: number
  totalApiCalls: number
}

export type AwActivityError = {
  connected: false
  error: string
}

export type AwActivityResult = AwActivitySummary | AwActivityError
