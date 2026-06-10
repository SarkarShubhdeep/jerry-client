export type LlmStatusPhase =
  | 'thinking'
  | 'web_search_searching'
  | 'web_search_done'
  | 'finalizing'
  | 'done'

export type LlmStatusUpdate = {
  phase: LlmStatusPhase
  /** Optional; hosts map phase codes to UI copy. */
  label?: string
  durationMs?: number
}

export type LlmStatusCallback = (update: LlmStatusUpdate) => void
