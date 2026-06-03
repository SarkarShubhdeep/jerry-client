import { ipcMain } from 'electron'
import {
  getApiKeyConfiguration,
  getPublicSetting,
  isPublicSettingsKey,
  isSettingsKey,
  setSetting,
  type PublicSettingsKey,
  type SettingsKey,
} from '../store/settings'
import type { IpcResult } from './aw'

export function registerSettingsIpc(): void {
  ipcMain.handle(
    'jerry:settings:get',
    async (_event, args: { key?: string }): Promise<IpcResult<string>> => {
      const key = args?.key
      if (typeof key !== 'string' || !isPublicSettingsKey(key)) {
        return { ok: false, error: 'Invalid settings key' }
      }

      try {
        return { ok: true, data: getPublicSetting(key as PublicSettingsKey) }
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

  ipcMain.handle(
    'jerry:settings:isConfigured',
    async (): Promise<IpcResult<{ openai: boolean; anthropic: boolean }>> => {
      try {
        return { ok: true, data: getApiKeyConfiguration() }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, error: message }
      }
    }
  )
}
