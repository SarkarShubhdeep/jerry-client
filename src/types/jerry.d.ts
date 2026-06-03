import type { AwActivitySummary, AwConnectionStatus, IpcResult } from './activitywatch'
import type { ChatMessage, ChatResponse, LlmStatusUpdate } from './llm'

export type PublicSettingsKey = 'theme' | 'openaiModel'
export type SecretSettingsKey = 'openaiApiKey' | 'anthropicApiKey'
export type SettingsKey = PublicSettingsKey | SecretSettingsKey

export type ApiKeyConfiguration = {
  openai: boolean
  anthropic: boolean
}

export interface JerryAPI {
  ping: () => string
  getVersion: () => string
  aw: {
    checkConnection: () => Promise<IpcResult<AwConnectionStatus>>
    fetchActivity: (rangeHours: number) => Promise<IpcResult<AwActivitySummary>>
  }
  llm: {
    chat: (
      messages: ChatMessage[],
      onStatus?: (update: LlmStatusUpdate) => void
    ) => Promise<IpcResult<ChatResponse>>
  }
  settings: {
    get: (key: PublicSettingsKey) => Promise<IpcResult<string>>
    set: (key: SettingsKey, value: string) => Promise<IpcResult<void>>
    isConfigured: () => Promise<IpcResult<ApiKeyConfiguration>>
  }
}

declare global {
  interface Window {
    jerry?: JerryAPI
  }
}

export {}
