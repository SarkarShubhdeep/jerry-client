export type WatcherKind = 'window' | 'web' | 'vscode' | 'afk' | 'other'

export type Bucket = {
  id: string
  type?: string
  client?: string
  hostname?: string
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

export type AwActivitySummary = {
  connected: true
  bucketCount: number
  rangeHours: number
  range: { start: string; end: string }
  afk: { status: string; timestamp: string } | null
  latest: LatestWatcherEvent[]
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
