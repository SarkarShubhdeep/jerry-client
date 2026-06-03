import type { AwActivitySummary, IpcResult } from './activitywatch'
import type { ChatMessage, ChatResponse, LlmStatusUpdate } from './llm'

export type SettingsKey = 'openaiApiKey'

export interface JerryAPI {
  ping: () => string
  getVersion: () => string
  aw: {
    fetchActivity: (rangeHours: number) => Promise<IpcResult<AwActivitySummary>>
  }
  llm: {
    chat: (
      messages: ChatMessage[],
      onStatus?: (update: LlmStatusUpdate) => void
    ) => Promise<IpcResult<ChatResponse>>
  }
  settings: {
    get: (key: SettingsKey) => Promise<IpcResult<string>>
    set: (key: SettingsKey, value: string) => Promise<IpcResult<void>>
  }
}

declare global {
  interface Window {
    jerry?: JerryAPI
  }
}

export {}
