import type { RawEvent, TopActivity, WatcherKind, WebLinkActivity } from './types'

const TOP_ACTIVITIES_LIMIT = 20
const TOP_WEB_LINKS_LIMIT = 25

const WORK_HOST_SUFFIXES = [
  'github.com',
  'gitlab.com',
  'stackoverflow.com',
  'stackexchange.com',
  'notion.so',
  'notion.site',
  'linear.app',
  'figma.com',
  'atlassian.net',
  'npmjs.com',
  'pypi.org',
  'readthedocs.io',
  'vercel.app',
  'netlify.app',
  'docs.google.com',
  'drive.google.com',
  'slack.com',
  'app.slack.com',
]

function hostMatchesWorkSuffix(hostname: string): boolean {
  const host = hostname.toLowerCase()
  if (host === 'github.io' || host.endsWith('.github.io')) {
    return true
  }
  return WORK_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`)
  )
}

function labelFromEvent(e: RawEvent, watcher: WatcherKind): { app: string; title: string } {
  const data = e.data ?? {}
  if (watcher === 'afk') {
    const status = typeof data.status === 'string' ? data.status : 'unknown'
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

function activityKey(watcher: WatcherKind, app: string, title: string): string {
  return `${watcher}\0${app}\0${title}`
}

/**
 * Sums event durations per (watcher, app, title) and returns top entries by duration.
 */
export function aggregateTopActivities(
  events: readonly RawEvent[],
  watcher: WatcherKind,
  limit: number = TOP_ACTIVITIES_LIMIT
): TopActivity[] {
  const totals = new Map<string, TopActivity>()

  for (const event of events) {
    const { app, title } = labelFromEvent(event, watcher)
    const key = activityKey(watcher, app, title)
    const durationSeconds = Math.max(0, event.duration ?? 0)
    const existing = totals.get(key)
    if (existing) {
      existing.durationSeconds += durationSeconds
      existing.eventCount += 1
    } else {
      totals.set(key, {
        watcher,
        app,
        title,
        durationSeconds,
        eventCount: 1,
      })
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.durationSeconds - a.durationSeconds)
    .slice(0, limit)
}

export function mergeTopActivities(
  perWatcher: TopActivity[],
  limit: number = TOP_ACTIVITIES_LIMIT
): TopActivity[] {
  return [...perWatcher]
    .sort((a, b) => b.durationSeconds - a.durationSeconds)
    .slice(0, limit)
}

function normalizeWebUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return url
  }
}

function pageTitleFromWebEvent(e: RawEvent, url: string): string {
  const data = e.data ?? {}
  const title = typeof data.title === 'string' ? data.title.trim() : ''
  if (title && title !== url) {
    return title
  }
  try {
    const { hostname, pathname } = new URL(url)
    const path = pathname === '/' ? '' : pathname
    return `${hostname}${path}`
  } catch {
    return url
  }
}

export function isWorkRelatedUrl(url: string): boolean {
  try {
    return hostMatchesWorkSuffix(new URL(url).hostname)
  } catch {
    return false
  }
}

/**
 * Aggregates web watcher events by URL; returns work-related links sorted by duration.
 */
export function aggregateTopWebLinks(
  events: readonly RawEvent[],
  limit: number = TOP_WEB_LINKS_LIMIT
): WebLinkActivity[] {
  const totals = new Map<string, WebLinkActivity>()

  for (const event of events) {
    const rawUrl = event.data?.url
    if (typeof rawUrl !== 'string' || !rawUrl.startsWith('http')) {
      continue
    }
    const url = normalizeWebUrl(rawUrl)
    if (!isWorkRelatedUrl(url)) {
      continue
    }

    const durationSeconds = Math.max(0, event.duration ?? 0)
    const title = pageTitleFromWebEvent(event, url)
    const existing = totals.get(url)
    if (existing) {
      existing.durationSeconds += durationSeconds
      existing.eventCount += 1
      if (title.length > existing.title.length && title !== url) {
        existing.title = title
      }
    } else {
      totals.set(url, {
        url,
        title,
        durationSeconds,
        eventCount: 1,
      })
    }
  }

  return [...totals.values()]
    .sort((a, b) => b.durationSeconds - a.durationSeconds)
    .slice(0, limit)
}
