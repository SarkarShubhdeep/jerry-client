import OpenAI from 'openai'
import type {
  GenerateReportInput,
  RecheckReportInput,
  ReportProgress,
  ReportResult,
} from '../types.ts'
import type { ChatMessage } from './types.ts'
import { getRecheckPrompt, getReportPrompt } from './prompt.ts'
import { chatCompletion, requireApiKey, resolveModel } from './internal.ts'

async function writeNarrative(
  client: OpenAI,
  modelId: string,
  activityContext: string,
  userPrompt: string,
  onProgress?: ReportProgress,
): Promise<string> {
  onProgress?.('writing')
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: await getReportPrompt(modelId, activityContext),
    },
    {
      role: 'user',
      content: userPrompt.trim(),
    },
  ]
  return await chatCompletion(client, modelId, messages)
}

/** Review and refine a draft report against ActivityWatch context. */
export async function recheckReport(
  input: RecheckReportInput,
  onProgress?: ReportProgress,
): Promise<string> {
  const apiKey = requireApiKey(input.config.apiKey)
  const modelId = resolveModel(input.config.model)
  const client = new OpenAI({ apiKey })

  onProgress?.('rechecking')
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: await getRecheckPrompt(modelId, input.activityContext),
    },
    {
      role: 'user',
      content: [
        `Original request: ${input.userPrompt.trim()}`,
        '\n## Draft report\n',
        input.draft,
      ].join(''),
    },
  ]
  return await chatCompletion(client, modelId, messages)
}

/**
 * Draft and recheck a work narrative from pre-formatted ActivityWatch context.
 * The host is responsible for fetching AW data and calling formatActivityContext().
 */
export async function generateReport(
  input: GenerateReportInput,
  onProgress?: ReportProgress,
): Promise<ReportResult> {
  const apiKey = requireApiKey(input.config.apiKey)
  const modelId = resolveModel(input.config.model)
  const client = new OpenAI({ apiKey })

  let content = await writeNarrative(
    client,
    modelId,
    input.activityContext,
    input.userPrompt,
    onProgress,
  )

  content = await recheckReport(
    {
      userPrompt: input.userPrompt,
      activityContext: input.activityContext,
      draft: content,
      config: input.config,
    },
    onProgress,
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
