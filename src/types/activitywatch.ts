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

export type AwActivitySummary = {
  connected: true
  bucketCount: number
  rangeHours: number
  range: { start: string; end: string }
  afk: { status: string; timestamp: string } | null
  latest: LatestWatcherEvent[]
  eventCounts: Partial<Record<WatcherKind, number>>
  eventFetchPages: Partial<Record<WatcherKind, number>>
  totalEventCount: number
  totalApiCalls: number
}

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }
