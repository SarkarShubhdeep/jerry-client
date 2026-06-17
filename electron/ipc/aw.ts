import { ipcMain } from 'electron'
import {
  checkActivityWatchConnection,
  fetchActivitySummary,
  rangeFromHours,
} from '../aw/client'

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string }

export function registerAwIpc(): void {
  ipcMain.handle('jerry:aw:checkConnection', async (): Promise<IpcResult<Awaited<ReturnType<typeof checkActivityWatchConnection>>>> => {
    try {
      return { ok: true, data: await checkActivityWatchConnection() }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return { ok: false, error: message }
    }
  })

  ipcMain.handle(
    'jerry:aw:fetchActivity',
    async (_event, args: { rangeHours?: number }): Promise<IpcResult<Awaited<ReturnType<typeof fetchActivitySummary>>>> => {
      const rangeHours =
        typeof args?.rangeHours === 'number' && Number.isFinite(args.rangeHours)
          ? args.rangeHours
          : 5

      try {
        const data = await fetchActivitySummary(rangeFromHours(rangeHours))
        if (!data.connected) {
          return { ok: false, error: data.error }
        }
        return { ok: true, data }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, error: message }
      }
    }
  )
}
