import fs from 'fs'
import path from 'path'
import {
  checkActivityWatchConnection,
  fetchActivitySummary,
} from '../aw/client.js'
import { formatActivityContext } from '../llm/activity-context.js'
import { generateReport } from '../llm/client.js'
import { resolveRangeHours } from '../llm/activity-intent.js'
import { ensureReportsDir, loadConfig, type JerryCliConfig } from '../config.js'
import { Spinner } from '../spinner.js'

export type ReportOptions = {
  prompt: string
  hours?: number
  dryRun?: boolean
  stdout?: boolean
}

function timestampForFilename(): string {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

function buildReportMarkdown(
  prompt: string,
  body: string,
  rangeHours: number,
  model: string
): string {
  const generatedAt = new Date().toISOString()
  return `---
generatedAt: ${generatedAt}
rangeHours: ${rangeHours}
model: ${model}
prompt: ${JSON.stringify(prompt)}
---

${body}
`
}

export async function runReport(options: ReportOptions): Promise<string> {
  const prompt = options.prompt?.trim()
  if (!prompt) {
    throw new Error('Provide a report prompt, e.g. jerry report "summarize my past hour"')
  }

  const config = loadConfig()
  const rangeHours = resolveRangeHours(prompt, options.hours)
  const spinner = new Spinner()

  try {
    if (options.dryRun) {
      return await dryRunReport(prompt, rangeHours, config, spinner)
    }

    spinner.start('Starting report…')

    const response = await generateReport(
      prompt,
      rangeHours,
      {
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
      },
      (label) => spinner.update(label)
    )

    const markdown = buildReportMarkdown(
      prompt,
      response.message.content,
      rangeHours,
      response.model
    )

    if (options.stdout) {
      spinner.stop('Report ready')
      process.stdout.write(markdown)
      return '(stdout)'
    }

    spinner.update('Saving report…')
    ensureReportsDir(config.reportsDir)
    const filePath = path.join(
      config.reportsDir,
      `report-${timestampForFilename()}.md`
    )
    fs.writeFileSync(filePath, markdown, 'utf8')
    spinner.stop('Report saved')
    return filePath
  } catch (err) {
    spinner.stop()
    throw err
  }
}

async function dryRunReport(
  prompt: string,
  rangeHours: number,
  config: JerryCliConfig,
  spinner: Spinner
): Promise<string> {
  spinner.start('Dry run — fetching ActivityWatch…')

  try {
    const connection = await checkActivityWatchConnection()
    if (!connection.connected) {
      throw new Error(connection.error ?? 'ActivityWatch is not reachable')
    }

    spinner.update('Reading ActivityWatch events…')
    const summary = await fetchActivitySummary(rangeHours)
    if (!summary.connected) {
      throw new Error(summary.error)
    }

    const context = formatActivityContext(summary)
    const preview = [
      `# Dry run`,
      ``,
      `Prompt: ${prompt}`,
      `Range: ${rangeHours}h`,
      `Reports dir: ${config.reportsDir}`,
      `Model (would use): ${config.openaiModel}`,
      ``,
      context,
    ].join('\n')

    spinner.stop('Dry run complete')
    if (process.stdout.isTTY) {
      process.stdout.write(preview + '\n')
    }
    return '(dry-run)'
  } catch (err) {
    spinner.stop()
    throw err
  }
}
