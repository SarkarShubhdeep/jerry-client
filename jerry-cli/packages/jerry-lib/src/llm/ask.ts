import OpenAI from 'openai'
import type { EasyInputMessage } from 'openai/resources/responses/responses'
import type { JerryLlmConfig } from '../types.ts'
import { getAskPrompt } from './prompt.ts'
import { chatCompletion, requireApiKey, resolveModel } from './internal.ts'
import type { LlmStatusCallback, LlmStatusUpdate } from './status.ts'

function emitStatus(
  onStatus: LlmStatusCallback | undefined,
  update: LlmStatusUpdate,
): void {
  onStatus?.(update)
}

function formatWebSearchDone(durationMs: number | undefined): string {
  if (!durationMs || durationMs < 1000) {
    return 'Searched web'
  }
  const seconds = Math.max(1, Math.round(durationMs / 1000))
  return `Searched web for ${seconds}s`
}

function shouldFallbackToCompletions(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes('web_search') ||
    msg.includes('tool') ||
    msg.includes('responses') ||
    msg.includes('not supported') ||
    msg.includes('invalid') ||
    msg.includes('model')
  )
}

async function askViaResponses(
  client: OpenAI,
  modelId: string,
  question: string,
  onStatus?: LlmStatusCallback,
): Promise<string> {
  const input: EasyInputMessage[] = [
    { role: 'developer', content: await getAskPrompt(modelId) },
    { role: 'user', content: question.trim() },
  ]

  let webSearchStartedAt: number | null = null
  let webSearchSearchingEmitted = false
  let finalizingEmitted = false
  let text = ''

  const stream = await client.responses.create({
    model: modelId,
    input,
    tools: [{ type: 'web_search_preview' }],
    stream: true,
  })

  for await (const event of stream) {
    switch (event.type) {
      case 'response.in_progress':
      case 'response.created':
        emitStatus(onStatus, { phase: 'thinking', label: 'Thinking…' })
        break

      case 'response.web_search_call.in_progress':
      case 'response.web_search_call.searching':
        if (!webSearchSearchingEmitted) {
          webSearchSearchingEmitted = true
          webSearchStartedAt = Date.now()
          emitStatus(onStatus, {
            phase: 'web_search_searching',
            label: 'Searching web…',
          })
        }
        break

      case 'response.web_search_call.completed': {
        const durationMs = webSearchStartedAt ? Date.now() - webSearchStartedAt : undefined
        emitStatus(onStatus, {
          phase: 'web_search_done',
          label: formatWebSearchDone(durationMs),
          durationMs,
        })
        break
      }

      case 'response.output_text.delta':
        if (!finalizingEmitted) {
          finalizingEmitted = true
          emitStatus(onStatus, { phase: 'finalizing', label: 'Finalizing answer…' })
        }
        text += event.delta
        break

      case 'response.completed': {
        const content = event.response.output_text?.trim() || text.trim()
        if (!content) {
          throw new Error('No response from the model')
        }
        emitStatus(onStatus, { phase: 'done', label: 'Done' })
        return content
      }

      case 'response.failed':
        throw new Error(event.response.error?.message ?? 'The model response failed')

      case 'error':
        throw new Error(event.message)

      default:
        break
    }
  }

  if (text.trim()) {
    emitStatus(onStatus, { phase: 'done', label: 'Done' })
    return text.trim()
  }

  throw new Error('No response from the model')
}

async function askViaCompletions(
  client: OpenAI,
  modelId: string,
  question: string,
  onStatus?: LlmStatusCallback,
): Promise<string> {
  emitStatus(onStatus, { phase: 'thinking', label: 'Thinking…' })

  let finalizingEmitted = false
  let text = ''

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: await getAskPrompt(modelId) },
      { role: 'user', content: question.trim() },
    ],
    stream: true,
  })

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content
    if (!delta) continue

    if (!finalizingEmitted) {
      finalizingEmitted = true
      emitStatus(onStatus, { phase: 'finalizing', label: 'Finalizing answer…' })
    }
    text += delta
  }

  const content = text.trim()
  if (!content) {
    throw new Error('No response from the model')
  }

  emitStatus(onStatus, { phase: 'done', label: 'Done' })
  return content
}

/** One-shot chat with the configured model (no ActivityWatch). Uses web search when supported. */
export async function ask(
  question: string,
  config: JerryLlmConfig,
  onStatus?: LlmStatusCallback,
): Promise<string> {
  const apiKey = requireApiKey(config.apiKey)
  const modelId = resolveModel(config.model)
  const client = new OpenAI({ apiKey })

  emitStatus(onStatus, { phase: 'thinking', label: 'Thinking…' })

  try {
    return await askViaResponses(client, modelId, question, onStatus)
  } catch (err) {
    if (!shouldFallbackToCompletions(err)) {
      throw err
    }
    return await askViaCompletions(client, modelId, question, onStatus)
  }
}
