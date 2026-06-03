import { ipcMain } from 'electron'
import {
  getSetting,
  isSettingsKey,
  setSetting,
  type SettingsKey,
} from '../store/settings'
import type { IpcResult } from './aw'

export function registerSettingsIpc(): void {
  ipcMain.handle(
    'jerry:settings:get',
    async (_event, args: { key?: string }): Promise<IpcResult<string>> => {
      const key = args?.key
      if (typeof key !== 'string' || !isSettingsKey(key)) {
        return { ok: false, error: 'Invalid settings key' }
      }

      try {
        return { ok: true, data: getSetting(key as SettingsKey) }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, error: message }
      }
    }
  )

  ipcMain.handle(
    'jerry:settings:set',
    async (_event, args: { key?: string; value?: unknown }): Promise<IpcResult<void>> => {
      const key = args?.key
      if (typeof key !== 'string' || !isSettingsKey(key)) {
        return { ok: false, error: 'Invalid settings key' }
      }
      if (typeof args?.value !== 'string') {
        return { ok: false, error: 'Settings value must be a string' }
      }

      try {
        setSetting(key as SettingsKey, args.value)
        return { ok: true, data: undefined }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, error: message }
      }
    }
  )
}
