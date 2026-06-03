'use client'

import { useCallback, useState } from 'react'
import { Activity, Loader2, RefreshCw, Send, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { AwActivitySummary, IpcResult } from '@/types/activitywatch'

type RangePreset = '5h' | 'today'

function hoursForPreset(preset: RangePreset): number {
  if (preset === '5h') return 5
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  return (now.getTime() - start.getTime()) / (60 * 60 * 1000)
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function ChatShell() {
  const [preset, setPreset] = useState<RangePreset>('5h')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<AwActivitySummary | null>(null)
  const [draft, setDraft] = useState('')

  const fetchActivity = useCallback(async () => {
    if (!window.jerry?.aw) {
      setError('ActivityWatch API is only available in the Electron app.')
      return
    }

    setLoading(true)
    setError(null)

    const result: IpcResult<AwActivitySummary> = await window.jerry.aw.fetchActivity(
      hoursForPreset(preset)
    )

    setLoading(false)

    if (!result.ok) {
      setSummary(null)
      setError(result.error)
      return
    }

    setSummary(result.data)
  }, [preset])

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-2 border-b px-4 py-3">
        <Sparkles className="size-5 text-muted-foreground" aria-hidden="true" />
        <h1 className="text-lg font-semibold tracking-tight">Jerry</h1>
        <Badge
          variant={summary ? 'default' : 'secondary'}
          className="ml-auto"
        >
          {summary ? 'ActivityWatch connected' : 'Not checked'}
        </Badge>
      </header>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 py-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <Activity className="size-4" aria-hidden="true" />
                ActivityWatch
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={preset === '5h' ? 'default' : 'outline'}
                  onClick={() => setPreset('5h')}
                >
                  Last 5 hours
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={preset === 'today' ? 'default' : 'outline'}
                  onClick={() => setPreset('today')}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={fetchActivity}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden="true" />
                  )}
                  Fetch watchers
                </Button>
              </div>

              {error && (
                <p className="text-destructive text-sm" role="alert">
                  {error}
                </p>
              )}

              {summary && (
                <div className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    {summary.bucketCount} buckets ·{' '}
                    {summary.rangeHours < 1
                      ? 'under 1 hour'
                      : `${Math.round(summary.rangeHours * 10) / 10}h`}{' '}
                    window · {formatTime(summary.range.start)} –{' '}
                    {formatTime(summary.range.end)}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {summary.totalEventCount.toLocaleString()} events ·{' '}
                    {summary.totalApiCalls} API call
                    {summary.totalApiCalls === 1 ? '' : 's'} (1,000 per page)
                  </p>
                  {summary.afk && (
                    <p>
                      AFK:{' '}
                      <span className="font-medium">{summary.afk.status}</span>{' '}
                      <span className="text-muted-foreground">
                        ({formatTime(summary.afk.timestamp)})
                      </span>
                    </p>
                  )}
                  <ul className="space-y-1.5">
                    {summary.latest.map((item) => (
                      <li key={item.watcher} className="rounded-md border px-2 py-1.5">
                        <span className="text-muted-foreground uppercase text-xs">
                          {item.watcher}
                        </span>
                        <p className="font-medium truncate">{item.app}</p>
                        {item.title && item.watcher !== 'afk' && (
                          <p className="text-muted-foreground truncate text-xs">
                            {item.title}
                          </p>
                        )}
                        <p className="text-muted-foreground text-xs">
                          {formatTime(item.timestamp)} ·{' '}
                          {(summary.eventCounts[item.watcher] ?? 0).toLocaleString()}{' '}
                          events
                          {(summary.eventFetchPages[item.watcher] ?? 1) > 1 &&
                            ` · ${summary.eventFetchPages[item.watcher]} pages`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <div
            className="rounded-lg border border-dashed p-6 text-center text-muted-foreground text-sm"
            role="log"
            aria-live="polite"
          >
            Chat messages will appear here. Narratives from ActivityWatch land in a
            later ticket.
          </div>
        </div>
      </ScrollArea>

      <footer className="flex gap-2 border-t p-3">
        <Input
          placeholder="Ask Jerry…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          aria-label="Message"
        />
        <Button type="button" size="icon" disabled aria-label="Send (coming soon)">
          <Send className="size-4" aria-hidden="true" />
        </Button>
      </footer>
    </div>
  )
}
