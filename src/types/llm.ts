export type ChatRole = 'user' | 'assistant' | 'system'

export type LlmApiPath = 'responses' | 'completions'

export type ChatMessage = {
  role: ChatRole
  content: string
  model?: string
  api?: LlmApiPath
}

export type ChatRequest = {
  messages: ChatMessage[]
}

export type ChatResponse = {
  message: ChatMessage
  model: string
  api: LlmApiPath
}

export type LlmStatusPhase =
  | 'fetching_activity'
  | 'thinking'
  | 'web_search_searching'
  | 'web_search_done'
  | 'finalizing'
  | 'done'

export type LlmStatusUpdate = {
  phase: LlmStatusPhase
  label: string
  durationMs?: number
}
