import OpenAI from 'openai'
import type { EasyInputMessage } from 'openai/resources/responses/responses'
import {
  checkActivityWatchConnection,
  fetchActivitySummary,
} from '../aw/client'
import { formatActivityContext } from './activity-context'
import {
  lastUserMessage,
  needsActivityContext,
  parseActivityRangeHours,
} from './activity-intent'
import { buildJerrySystemPrompt } from './prompt'
import type { LlmStatusCallback, LlmStatusUpdate } from './status'
import { getApiKey, getModel } from '../store/settings'
import type { ChatMessage, ChatResponse, LlmApiPath } from './types'

const API_KEY_ERROR = 'OpenAI API key is not configured. Add it in Settings.'

function stripMessageForApi(message: ChatMessage): ChatMessage {
  return { role: message.role, content: message.content }
}

function messagesForApi(
  messages: ChatMessage[],
  activityContext?: string
): ChatMessage[] {
  const stripped = messages.map(stripMessageForApi)
  if (stripped.some((m) => m.role === 'system')) {
    return stripped
  }
  const modelId = getModel()
  return [
    {
      role: 'system',
      content: buildJerrySystemPrompt(modelId, activityContext),
    },
    ...stripped,
  ]
}

async function resolveActivityContext(
  messages: ChatMessage[],
  onStatus?: LlmStatusCallback
): Promise<string | undefined> {
  const userText = lastUserMessage(messages)
  if (!userText || !needsActivityContext(userText)) {
    return undefined
  }

  emit(onStatus, { phase: 'fetching_activity', label: 'Reading ActivityWatch…' })

  const connection = await checkActivityWatchConnection()
  if (!connection.connected) {
    throw new Error(
      connection.error ??
        'ActivityWatch is not reachable. Start ActivityWatch and ensure the AW badge is green.'
    )
  }

  const rangeHours = parseActivityRangeHours(userText)
  const summary = await fetchActivitySummary(rangeHours)
  if (!summary.connected) {
    throw new Error(summary.error)
  }

  return formatActivityContext(summary)
}

function assistantMessage(
  content: string,
  model: string,
  api: LlmApiPath
): ChatResponse {
  return {
    model,
    api,
    message: { role: 'assistant', content, model, api },
  }
}

function toResponsesInput(
  messages: ChatMessage[],
  activityContext?: string
): EasyInputMessage[] {
  return messagesForApi(messages, activityContext).map((m) => ({
    role: m.role === 'system' ? 'developer' : m.role,
    content: m.content,
  }))
}

function emit(onStatus: LlmStatusCallback | undefined, update: LlmStatusUpdate): void {
  onStatus?.(update)
}

function formatWebSearchDone(durationMs: number | undefined): string {
  if (!durationMs || durationMs < 1000) {
    return 'Searched web'
  }
  const seconds = Math.max(1, Math.round(durationMs / 1000))
  return `Searched web for ${seconds}s`
}

async function chatViaResponses(
  client: OpenAI,
  input: EasyInputMessage[],
  requestedModel: string,
  onStatus?: LlmStatusCallback
): Promise<ChatResponse> {
  let webSearchStartedAt: number | null = null
  let webSearchSearchingEmitted = false
  let finalizingEmitted = false
  let text = ''

  const stream = await client.responses.create({
    model: requestedModel,
    input,
    tools: [{ type: 'web_search_preview' }],
    stream: true,
  })

  for await (const event of stream) {
    switch (event.type) {
      case 'response.in_progress':
      case 'response.created':
        emit(onStatus, { phase: 'thinking', label: 'Thinking…' })
        break

      case 'response.web_search_call.in_progress':
      case 'response.web_search_call.searching':
        if (!webSearchSearchingEmitted) {
          webSearchSearchingEmitted = true
          webSearchStartedAt = Date.now()
          emit(onStatus, { phase: 'web_search_searching', label: 'Searching web…' })
        }
        break

      case 'response.web_search_call.completed': {
        const durationMs = webSearchStartedAt ? Date.now() - webSearchStartedAt : undefined
        emit(onStatus, {
          phase: 'web_search_done',
          label: formatWebSearchDone(durationMs),
          durationMs,
        })
        break
      }

      case 'response.output_text.delta':
        if (!finalizingEmitted) {
          finalizingEmitted = true
          emit(onStatus, { phase: 'finalizing', label: 'Finalizing answer…' })
        }
        text += event.delta
        break

      case 'response.completed': {
        const content = event.response.output_text?.trim() || text.trim()
        if (!content) {
          throw new Error('No response from the model')
        }
        const resolvedModel = event.response.model ?? requestedModel
        emit(onStatus, { phase: 'done', label: 'Done' })
        return assistantMessage(content, resolvedModel, 'responses')
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
    emit(onStatus, { phase: 'done', label: 'Done' })
    return assistantMessage(text.trim(), requestedModel, 'responses')
  }

  throw new Error('No response from the model')
}

async function chatViaCompletions(
  client: OpenAI,
  messages: ChatMessage[],
  requestedModel: string,
  onStatus?: LlmStatusCallback
): Promise<ChatResponse> {
  emit(onStatus, { phase: 'thinking', label: 'Thinking…' })

  let finalizingEmitted = false
  let text = ''

  const stream = await client.chat.completions.create({
    model: requestedModel,
    messages,
    stream: true,
  })

  let resolvedModel = requestedModel

  for await (const chunk of stream) {
    if (chunk.model) {
      resolvedModel = chunk.model
    }
    const delta = chunk.choices[0]?.delta?.content
    if (!delta) continue

    if (!finalizingEmitted) {
      finalizingEmitted = true
      emit(onStatus, { phase: 'finalizing', label: 'Finalizing answer…' })
    }
    text += delta
  }

  const content = text.trim()
  if (!content) {
    throw new Error('No response from the model')
  }

  emit(onStatus, { phase: 'done', label: 'Done' })
  return assistantMessage(content, resolvedModel, 'completions')
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

export async function chat(
  messages: ChatMessage[],
  onStatus?: LlmStatusCallback
): Promise<ChatResponse> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(API_KEY_ERROR)
  }

  const client = new OpenAI({ apiKey })
  const requestedModel = getModel()
  const activityContext = await resolveActivityContext(messages, onStatus)
  const input = toResponsesInput(messages, activityContext)
  const apiMessages = messagesForApi(messages, activityContext)

  emit(onStatus, { phase: 'thinking', label: 'Thinking…' })

  try {
    return await chatViaResponses(client, input, requestedModel, onStatus)
  } catch (err) {
    if (!shouldFallbackToCompletions(err)) {
      throw err
    }
    return await chatViaCompletions(client, apiMessages, requestedModel, onStatus)
  }
}
