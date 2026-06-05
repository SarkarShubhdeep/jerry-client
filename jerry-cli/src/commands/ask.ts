import { loadConfig } from '../config.js'
import { askQuestion } from '../llm/client.js'
import type { LlmStatusUpdate } from '../llm/status.js'
import { Spinner } from '../spinner.js'

function bindSpinnerProgress(spinner: Spinner): {
  onStatus: (update: LlmStatusUpdate) => void
  flush: () => void
} {
  let lastLabel = ''

  const onStatus = (update: LlmStatusUpdate): void => {
    const label = update.label
    if (!label) return

    if (lastLabel && lastLabel !== label) {
      spinner.markStep(lastLabel)
    }
    spinner.resume(label)
    spinner.update(label)
    lastLabel = label
  }

  const flush = (): void => {
    if (lastLabel) {
      spinner.markStep(lastLabel)
      lastLabel = ''
    }
  }

  return { onStatus, flush }
}

export async function runAsk(question: string): Promise<void> {
  const trimmed = question?.trim()
  if (!trimmed) {
    throw new Error('Provide a question, e.g. jerry ask "what is a closure?"')
  }

  const config = loadConfig()
  const spinner = new Spinner()
  const { onStatus, flush } = bindSpinnerProgress(spinner)

  try {
    spinner.start('Thinking…')
    const answer = await askQuestion(
      trimmed,
      {
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
      },
      onStatus
    )
    flush()
    spinner.stop()
    process.stdout.write(`${answer}\n`)
  } catch (err) {
    spinner.stop()
    throw err
  }
}
