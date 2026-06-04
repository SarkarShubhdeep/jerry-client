import OpenAI from 'openai'
import {
  checkActivityWatchConnection,
  fetchActivitySummary,
} from '../aw/client.js'
import { formatActivityContext } from './activity-context.js'
import { buildJerrySystemPrompt } from './prompt.js'
import type { ChatMessage, ChatResponse } from './types.js'
import { DEFAULT_OPENAI_MODEL, isAllowedOpenAiModel } from './models.js'

export type JerryCliLlmConfig = {
  apiKey: string
  model: string
}

const API_KEY_ERROR =
  'OpenAI API key is not configured. Run: jerry config set openai-api-key'

function resolveModel(model: string): string {
  return isAllowedOpenAiModel(model) ? model : DEFAULT_OPENAI_MODEL
}

/**
 * Stateless one-shot report: one system message (with AW context) + one user message.
 * Uses Chat Completions only (no web search).
 */
export async function generateReport(
  prompt: string,
  rangeHours: number,
  config: JerryCliLlmConfig,
  onProgress?: (label: string) => void
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
  const summary = await fetchActivitySummary(rangeHours)
  if (!summary.connected) {
    throw new Error(summary.error)
  }

  const activityContext = formatActivityContext(summary)
  const modelId = resolveModel(config.model)
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: buildJerrySystemPrompt(modelId, activityContext),
    },
    { role: 'user', content: prompt.trim() },
  ]

  onProgress?.('Generating report…')
  const client = new OpenAI({ apiKey })
  const completion = await client.chat.completions.create({
    model: modelId,
    messages,
    stream: false,
  })

  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('No response from the model')
  }

  const resolvedModel = completion.model ?? modelId
  return {
    model: resolvedModel,
    api: 'completions',
    message: {
      role: 'assistant',
      content,
      model: resolvedModel,
      api: 'completions',
    },
  }
}
