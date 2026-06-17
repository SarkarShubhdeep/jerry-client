import {
  checkActivityWatchConnection,
  fetchActivitySummary,
  listActivityWatchBuckets,
} from '../aw/client'
import { jerryLib, type JerryLlmConfig, type ReportPhase } from '../jerry-lib-runtime'
import { getApiKey, getModel } from '../store/settings'
import { lastUserMessage, needsActivityContext } from './activity-intent'
import type { LlmStatusCallback, LlmStatusUpdate } from './status'
import type { ChatMessage, ChatResponse } from './types'

const API_KEY_ERROR = 'OpenAI API key is not configured. Add it in Settings.'

type LibLlmStatusUpdate = {
  phase: string
  label?: string
  durationMs?: number
}

function loadLlmConfig(): JerryLlmConfig {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new Error(API_KEY_ERROR)
  }
  return { apiKey, model: getModel() }
}

function emit(onStatus: LlmStatusCallback | undefined, update: LlmStatusUpdate): void {
  onStatus?.(update)
}

function mapAskStatus(onStatus: LlmStatusCallback | undefined) {
  return (update: LibLlmStatusUpdate): void => {
    const label = labelForLibAskStatus(update)
    if (!label) return
    emit(onStatus, {
      phase: update.phase as LlmStatusUpdate['phase'],
      label,
      durationMs: update.durationMs,
    })
  }
}

function labelForLibAskStatus(update: LibLlmStatusUpdate): string | undefined {
  if (update.label) return update.label

  switch (update.phase) {
    case 'thinking':
      return 'Thinking…'
    case 'web_search_searching':
      return 'Searching web…'
    case 'web_search_done': {
      if (!update.durationMs || update.durationMs < 1000) return 'Searched web'
      const seconds = Math.max(1, Math.round(update.durationMs / 1000))
      return `Searched web for ${seconds}s`
    }
    case 'finalizing':
      return 'Finalizing answer…'
    case 'done':
      return 'Done'
    default:
      return undefined
  }
}

function mapReportPhase(phase: ReportPhase): LlmStatusUpdate {
  switch (phase) {
    case 'writing':
      return { phase: 'thinking', label: 'Writing work narrative…' }
    case 'rechecking':
      return { phase: 'finalizing', label: 'Rechecking the work narrative…' }
    default: {
      const _exhaustive: never = phase
      return _exhaustive
    }
  }
}

async function resolveActivityContext(
  userText: string,
  onStatus?: LlmStatusCallback
): Promise<string> {
  const { formatActivityContext, resolveActivityRange } = jerryLib()

  emit(onStatus, { phase: 'fetching_activity', label: 'Reading ActivityWatch…' })

  const connection = await checkActivityWatchConnection()
  if (!connection.connected) {
    throw new Error(
      connection.error ??
        'ActivityWatch is not reachable. Start ActivityWatch and ensure the AW badge is green.'
    )
  }

  const buckets = await listActivityWatchBuckets()
  const activityRange = resolveActivityRange(userText, undefined, buckets, {
    strict: false,
  })
  const summary = await fetchActivitySummary(activityRange)
  if (!summary.connected) {
    throw new Error(summary.error)
  }

  return formatActivityContext(summary)
}

export async function chat(
  messages: ChatMessage[],
  onStatus?: LlmStatusCallback
): Promise<ChatResponse> {
  const { ask, generateReport } = jerryLib()
  const userText = lastUserMessage(messages)
  if (!userText) {
    throw new Error('No user message to send')
  }

  const config = loadLlmConfig()

  if (needsActivityContext(userText)) {
    const activityContext = await resolveActivityContext(userText, onStatus)
    const onProgress = (phase: ReportPhase): void => {
      emit(onStatus, mapReportPhase(phase))
    }

    const response = await generateReport(
      { userPrompt: userText, activityContext, config },
      onProgress
    )

    emit(onStatus, { phase: 'done', label: 'Done' })
    return {
      model: response.model,
      api: response.api,
      message: {
        role: 'assistant',
        content: response.message.content,
        model: response.model,
        api: response.api,
      },
    }
  }

  const answer = await ask(userText, config, mapAskStatus(onStatus))
  emit(onStatus, { phase: 'done', label: 'Done' })
  return {
    model: config.model,
    api: 'completions',
    message: {
      role: 'assistant',
      content: answer,
      model: config.model,
      api: 'completions',
    },
  }
}
