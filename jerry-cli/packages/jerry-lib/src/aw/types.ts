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

export type WebLinkActivity = {
  url: string
  title: string
  durationSeconds: number
  eventCount: number
}

export type MeetingPlatform = 'google-meet' | 'zoom' | 'teams' | 'other'

export type MeetingSession = {
  platform: MeetingPlatform
  url: string
  meetingCode?: string
  title: string
  start: string
  end: string
  durationSeconds: number
  eventCount: number
}

export type AwActivitySummary = {
  connected: true
  bucketCount: number
  rangeHours: number
  rangeLabel: string
  range: { start: string; end: string }
  afk: { status: string; timestamp: string } | null
  latest: LatestWatcherEvent[]
  topActivities: TopActivity[]
  topWebLinks: WebLinkActivity[]
  meetingSessions: MeetingSession[]
  eventCounts: Partial<Record<WatcherKind, number>>
  eventFetchPages: Partial<Record<WatcherKind, number>>
  totalEventCount: number
  totalApiCalls: number
}

export type AwActivityError = {
  connected: false
  error: string
}

export type AwActivityResult = AwActivitySummary | AwActivityError
