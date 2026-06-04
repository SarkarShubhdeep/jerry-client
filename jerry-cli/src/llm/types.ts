export type ChatRole = 'user' | 'assistant' | 'system'

export type LlmApiPath = 'completions'

export type ChatMessage = {
  role: ChatRole
  content: string
  model?: string
  api?: LlmApiPath
}

export type ChatResponse = {
  message: ChatMessage
  model: string
  api: LlmApiPath
}
