import type { AwActivitySummary, WatcherKind } from '../aw/types'

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  }
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const rem = minutes % 60
  return rem > 0 ? `${hours}h ${rem}m` : `${hours}h`
}

function formatWatcherCounts(
  counts: Partial<Record<WatcherKind, number>>
): string {
  const parts = Object.entries(counts)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([watcher, n]) => `${watcher}: ${n}`)
  return parts.length > 0 ? parts.join(', ') : 'none'
}

export function formatActivityContext(summary: AwActivitySummary): string {
  const lines: string[] = [
    '## ActivityWatch data (local, read-only)',
    '',
    summary.rangeLabel
      ? `Requested window: ${summary.rangeLabel}`
      : `Time range: ${summary.range.start} to ${summary.range.end}`,
    `Time range (ISO): ${summary.range.start} to ${summary.range.end}`,
    `Span: ${summary.rangeHours.toFixed(2)}h`,
    `Total events in range: ${summary.totalEventCount}`,
    `Events per watcher: ${formatWatcherCounts(summary.eventCounts)}`,
  ]

  if (summary.afk) {
    lines.push(`AFK status (latest): ${summary.afk.status} at ${summary.afk.timestamp}`)
  }

  if (summary.totalEventCount === 0) {
    lines.push('', 'No ActivityWatch events were recorded in this time range.')
  } else if (summary.topActivities.length > 0) {
    lines.push('', '### Top activities by tracked duration')
    for (const row of summary.topActivities) {
      const titlePart = row.title ? ` — ${row.title}` : ''
      lines.push(
        `- [${row.watcher}] ${row.app}${titlePart}: ${formatDuration(row.durationSeconds)} (${row.eventCount} events)`
      )
    }
  }

  if (summary.topWebLinks.length > 0) {
    lines.push(
      '',
      '### Work-related web links (ActivityWatch web watcher)',
      'Include these URLs in your reply when summarizing work (use Markdown links).'
    )
    for (const link of summary.topWebLinks) {
      const label = link.title.replace(/[\[\]]/g, '').trim() || link.url
      lines.push(
        `- [${label.slice(0, 120)}](${link.url}) — ${formatDuration(link.durationSeconds)} (${link.eventCount} visits)`
      )
    }
  }

  if (summary.latest.length > 0) {
    lines.push('', '### Latest snapshot per watcher')
    for (const row of summary.latest) {
      const titlePart = row.title ? ` — ${row.title}` : ''
      lines.push(
        `- [${row.watcher}] ${row.app}${titlePart} at ${row.timestamp}`
      )
    }
  }

  lines.push(
    '',
    'Use only the data above for activity and work questions. Do not invent apps, URLs, or durations not listed. When work-related web links are present, add a **Links** section with the most relevant GitHub/repos/docs URLs from that list. If the user asks about a period outside this range, say so.'
  )

  return lines.join('\n')
}
