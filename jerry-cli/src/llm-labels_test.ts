import { assertEquals } from 'jsr:@std/assert@^1.0.13'
import { labelForLlmStatus, labelForReportPhase } from './llm-labels.ts'

Deno.test('labelForLlmStatus maps thinking phase to terminal copy', () => {
  assertEquals(labelForLlmStatus({ phase: 'thinking' }), 'Thinking…')
})

Deno.test('labelForReportPhase maps writing phase to terminal copy', () => {
  assertEquals(labelForReportPhase('writing'), 'Writing work narrative…')
})
