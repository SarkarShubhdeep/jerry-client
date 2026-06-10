import { ask, type LlmStatusUpdate } from '@jerry/lib'
import { loadConfig } from '../config.ts'
import { labelForLlmStatus } from '../llm-labels.ts'
import { Spinner } from '../spinner.ts'

function bindSpinnerProgress(spinner: Spinner): {
  onStatus: (update: LlmStatusUpdate) => void
  flush: () => void
} {
  let lastLabel = ''

  const onStatus = (update: LlmStatusUpdate): void => {
    const label = labelForLlmStatus(update)
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
    const answer = await ask(
      trimmed,
      {
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
      },
      onStatus,
    )
    flush()
    spinner.stop()
    const encoder = new TextEncoder()
    Deno.stdout.writeSync(encoder.encode(`${answer}\n`))
  } catch (err) {
    spinner.stop()
    throw err
  }
}
