import { contextBridge, ipcRenderer } from 'electron'
import type { AwActivitySummary } from './aw/types'
import type { IpcResult } from './ipc/aw'
import type { LlmStatusUpdate } from './llm/status'
import type { ChatMessage, ChatResponse } from './llm/types'

contextBridge.exposeInMainWorld('jerry', {
  ping: (): string => 'pong',
  getVersion: (): string => process.versions.electron,
  aw: {
    checkConnection: (): Promise<IpcResult<{ connected: boolean; error?: string }>> =>
      ipcRenderer.invoke('jerry:aw:checkConnection'),
    fetchActivity: (rangeHours: number): Promise<IpcResult<AwActivitySummary>> =>
      ipcRenderer.invoke('jerry:aw:fetchActivity', { rangeHours }),
  },
  llm: {
    chat: (
      messages: ChatMessage[],
      onStatus?: (update: LlmStatusUpdate) => void
    ): Promise<IpcResult<ChatResponse>> => {
      const handler = (_event: unknown, update: LlmStatusUpdate) => {
        onStatus?.(update)
      }
      if (onStatus) {
        ipcRenderer.on('jerry:llm:status', handler)
      }
      return ipcRenderer.invoke('jerry:llm:chat', { messages }).finally(() => {
        if (onStatus) {
          ipcRenderer.removeListener('jerry:llm:status', handler)
        }
      })
    },
  },
  settings: {
    get: (key: string): Promise<IpcResult<string>> =>
      ipcRenderer.invoke('jerry:settings:get', { key }),
    set: (key: string, value: string): Promise<IpcResult<void>> =>
      ipcRenderer.invoke('jerry:settings:set', { key, value }),
    isConfigured: (): Promise<IpcResult<{ openai: boolean; anthropic: boolean }>> =>
      ipcRenderer.invoke('jerry:settings:isConfigured'),
  },
})
