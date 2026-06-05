export type WatcherKind = 'window' | 'web' | 'vscode' | 'afk' | 'other'

export type LatestWatcherEvent = {
  watcher: WatcherKind
  bucketId: string
  app: string
  title: string
  timestamp: string
}

export type AwConnectionStatus = {
  connected: boolean
  error?: string
}

export type TopActivity = {
  watcher: WatcherKind
  app: string
  title: string
  durationSeconds: number
  eventCount: number
}

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
  topActivities: TopActivity[]
  topWebLinks: WebLinkActivity[]
  eventCounts: Partial<Record<WatcherKind, number>>
  eventFetchPages: Partial<Record<WatcherKind, number>>
  totalEventCount: number
  totalApiCalls: number
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }
