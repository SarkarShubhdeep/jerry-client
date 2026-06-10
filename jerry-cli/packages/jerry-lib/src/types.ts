import type { ChatResponse } from './llm/types.ts'

/** LLM credentials and model selection — supplied by the host, never read from env here. */
export type JerryLlmConfig = {
  apiKey: string
  model: string
}

export type ReportPhase = 'writing' | 'rechecking'

export type ReportProgress = (phase: ReportPhase) => void

/** Pure report input: host fetches ActivityWatch and formats context before calling. */
export type GenerateReportInput = {
  userPrompt: string
  activityContext: string
  config: JerryLlmConfig
}

export type RecheckReportInput = {
  userPrompt: string
  activityContext: string
  draft: string
  config: JerryLlmConfig
}

export type ReportResult = ChatResponse
