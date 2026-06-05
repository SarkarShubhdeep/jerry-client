import OpenAI from 'openai'
import type { EasyInputMessage } from 'openai/resources/responses/responses'
import {
  checkActivityWatchConnection,
  fetchActivitySummary,
} from '../aw/client.js'
import { formatActivityContext } from './activity-context.js'
import { type ActivityTimeRange } from './activity-intent.js'
import {
  buildAskSystemPrompt,
  buildJerrySystemPrompt,
  buildRecheckSystemPrompt,
} from './prompt.js'
import type { LlmStatusCallback, LlmStatusUpdate } from './status.js'
import type { ChatMessage, ChatResponse } from './types.js'
import { DEFAULT_OPENAI_MODEL, isAllowedOpenAiModel } from './models.js'

export type JerryCliLlmConfig = {
  apiKey: string
  model: string
}

export type ReportProgress = (label: string) => void

const API_KEY_ERROR =
  'OpenAI API key is not configured. Run: jerry config set openai-api-key'

function resolveModel(model: string): string {
  return isAllowedOpenAiModel(model) ? model : DEFAULT_OPENAI_MODEL
}

async function chatCompletion(
  client: OpenAI,
  modelId: string,
  messages: ChatMessage[],
  jsonMode?: boolean
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: modelId,
    messages,
    stream: false,
    ...(jsonMode ? { response_format: { type: 'json_object' as const } } : {}),
  })
  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('No response from the model')
  }
  return content
}

async function writeNarrative(
  client: OpenAI,
  modelId: string,
  activityContext: string,
  userPrompt: string,
  onProgress?: ReportProgress
): Promise<string> {
  onProgress?.('Writing work narrative…')
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: buildJerrySystemPrompt(modelId, activityContext),
    },
    {
      role: 'user',
      content: userPrompt.trim(),
    },
  ]
  return chatCompletion(client, modelId, messages)
}

async function recheckNarrative(
  client: OpenAI,
  modelId: string,
  activityContext: string,
  userPrompt: string,
  draft: string,
  onProgress?: ReportProgress
): Promise<string> {
  onProgress?.('Rechecking the work narrative…')
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: buildRecheckSystemPrompt(modelId, activityContext),
    },
    {
      role: 'user',
      content: [
        `Original request: ${userPrompt.trim()}`,
        '\n## Draft report\n',
        draft,
      ].join(''),
    },
  ]
  return chatCompletion(client, modelId, messages)
}

function emitStatus(
  onStatus: LlmStatusCallback | undefined,
  update: LlmStatusUpdate
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
  onStatus?: LlmStatusCallback
): Promise<string> {
  const input: EasyInputMessage[] = [
    { role: 'developer', content: buildAskSystemPrompt(modelId) },
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
        const durationMs = webSearchStartedAt
          ? Date.now() - webSearchStartedAt
          : undefined
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
  onStatus?: LlmStatusCallback
): Promise<string> {
  emitStatus(onStatus, { phase: 'thinking', label: 'Thinking…' })

  let finalizingEmitted = false
  let text = ''

  const stream = await client.chat.completions.create({
    model: modelId,
    messages: [
      { role: 'system', content: buildAskSystemPrompt(modelId) },
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
export async function askQuestion(
  question: string,
  config: JerryCliLlmConfig,
  onStatus?: LlmStatusCallback
): Promise<string> {
  const apiKey = config.apiKey.trim()
  if (!apiKey) {
    throw new Error(API_KEY_ERROR)
  }

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

/** Fetch ActivityWatch for the resolved window, then write and recheck the report. */
export async function generateReport(
  prompt: string,
  activityRange: ActivityTimeRange,
  config: JerryCliLlmConfig,
  onProgress?: ReportProgress
): Promise<ChatResponse> {
  const apiKey = config.apiKey.trim()
  if (!apiKey) {
    throw new Error(API_KEY_ERROR)
  }

  onProgress?.('Checking ActivityWatch…')
  const connection = await checkActivityWatchConnection()
  if (!connection.connected) {
    throw new Error(
      connection.error ??
        'ActivityWatch is not reachable. Start ActivityWatch and try again.'
    )
  }

  onProgress?.('Reading ActivityWatch…')
  const summary = await fetchActivitySummary({
    start: activityRange.start,
    end: activityRange.end,
    label: activityRange.label,
  })
  if (!summary.connected) {
    throw new Error(summary.error)
  }

  const activityContext = formatActivityContext(summary)
  const modelId = resolveModel(config.model)
  const client = new OpenAI({ apiKey })

  let content = await writeNarrative(
    client,
    modelId,
    activityContext,
    prompt,
    onProgress
  )

  content = await recheckNarrative(
    client,
    modelId,
    activityContext,
    prompt,
    content,
    onProgress
  )

  return {
    model: modelId,
    api: 'completions',
    message: {
      role: 'assistant',
      content,
      model: modelId,
      api: 'completions',
    },
  }
}
