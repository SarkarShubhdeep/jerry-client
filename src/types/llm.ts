export type ChatRole = 'user' | 'assistant' | 'system'

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type ChatRequest = {
  messages: ChatMessage[]
}

export type ChatResponse = {
  message: ChatMessage
}

export type LlmStatusPhase =
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
