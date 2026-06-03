export type ChatRole = 'user' | 'assistant' | 'system'

export type LlmApiPath = 'responses' | 'completions'

export type ChatMessage = {
  role: ChatRole
  content: string
  /** Set on assistant replies — OpenAI model ID used for that response */
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
