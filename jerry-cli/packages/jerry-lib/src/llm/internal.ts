import OpenAI from 'openai'
import type { ChatMessage } from './types.ts'
import { DEFAULT_OPENAI_MODEL, isAllowedOpenAiModel } from './models.ts'

export const API_KEY_ERROR = 'OpenAI API key is not configured'

export function resolveModel(model: string): string {
  return isAllowedOpenAiModel(model) ? model : DEFAULT_OPENAI_MODEL
}

export function requireApiKey(apiKey: string): string {
  const trimmed = apiKey.trim()
  if (!trimmed) {
    throw new Error(API_KEY_ERROR)
  }
  return trimmed
}

export async function chatCompletion(
  client: OpenAI,
  modelId: string,
  messages: ChatMessage[],
): Promise<string> {
  const completion = await client.chat.completions.create({
    model: modelId,
    messages,
    stream: false,
  })
  const content = completion.choices[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('No response from the model')
  }
  return content
}
