import fs from 'node:fs'
import path from 'node:path'
import {
  checkActivityWatchConnection,
  fetchActivitySummary,
  listActivityWatchBuckets,
} from '../aw/client.ts'
import { formatActivityContext } from '../llm/activity-context.ts'
import { generateReport } from '../llm/client.ts'
import {
  type ActivityTimeRange,
  formatActivityWindowLog,
  resolveActivityRange,
  resolveRangeHours,
} from '../llm/activity-intent.ts'
import { ensureReportsDir, type JerryCliConfig, loadConfig } from '../config.ts'
import { Spinner } from '../spinner.ts'

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
  rangeLabel: string,
  model: string,
): string {
  const generatedAt = new Date().toISOString()
  return `---
generatedAt: ${generatedAt}
rangeHours: ${rangeHours}
rangeLabel: ${JSON.stringify(rangeLabel)}
model: ${model}
prompt: ${JSON.stringify(prompt)}
---

${body}
`
}

export async function runReport(options: ReportOptions): Promise<string> {
  const prompt = options.prompt?.trim()
  if (!prompt) {
    throw new Error(
      'Provide a report prompt. Examples: jerry report today, jerry report yesterday, jerry report "May 13 to May 20"',
    )
  }

  const config = loadConfig()
  const spinner = new Spinner()

  try {
    const connection = await checkActivityWatchConnection()
    if (!connection.connected) {
      throw new Error(connection.error ?? 'ActivityWatch is not reachable')
    }

    const buckets = await listActivityWatchBuckets()
    const activityRange = resolveActivityRange(prompt, options.hours, buckets)
    const rangeHours = resolveRangeHours(prompt, options.hours, buckets)
    const encoder = new TextEncoder()
    Deno.stderr.writeSync(
      encoder.encode(`jerry: ActivityWatch window: ${formatActivityWindowLog(activityRange)}\n`),
    )

    if (options.dryRun) {
      return await dryRunReport(prompt, activityRange, config, spinner)
    }

    spinner.start('Starting report…')

    let lastLabel = ''
    const onProgress = (label: string): void => {
      if (lastLabel && lastLabel !== label) {
        spinner.markStep(lastLabel)
      }
      spinner.resume(label)
      spinner.update(label)
      lastLabel = label
    }

    const response = await generateReport(
      prompt,
      activityRange,
      {
        apiKey: config.openaiApiKey,
        model: config.openaiModel,
      },
      onProgress,
    )

    if (lastLabel) {
      spinner.markStep(lastLabel)
    }
    spinner.resume('Finishing up…')

    const markdown = buildReportMarkdown(
      prompt,
      response.message.content,
      rangeHours,
      activityRange.label,
      response.model,
    )

    if (options.stdout) {
      spinner.stop('Report ready')
      const encoder = new TextEncoder()
      Deno.stdout.writeSync(encoder.encode(markdown))
      return '(stdout)'
    }

    spinner.update('Saving report…')
    ensureReportsDir(config.reportsDir)
    const filePath = path.join(
      config.reportsDir,
      `report-${timestampForFilename()}.md`,
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
  activityRange: ActivityTimeRange,
  config: JerryCliConfig,
  spinner: Spinner,
): Promise<string> {
  spinner.start('Dry run — fetching ActivityWatch…')

  try {
    const connection = await checkActivityWatchConnection()
    if (!connection.connected) {
      throw new Error(connection.error ?? 'ActivityWatch is not reachable')
    }

    spinner.update('Reading ActivityWatch events…')
    const summary = await fetchActivitySummary({
      start: activityRange.start,
      end: activityRange.end,
      label: activityRange.label,
    })
    if (!summary.connected) {
      throw new Error(summary.error)
    }

    const context = formatActivityContext(summary)
    const preview = [
      `# Dry run`,
      ``,
      `Prompt: ${prompt}`,
      `Window: ${activityRange.label}`,
      `Range: ${summary.range.start} → ${summary.range.end}`,
      `Reports dir: ${config.reportsDir}`,
      `Model (would use): ${config.openaiModel}`,
      ``,
      context,
    ].join('\n')

    spinner.stop('Dry run complete')
    if (Deno.stdout.isTerminal()) {
      const encoder = new TextEncoder()
      Deno.stdout.writeSync(encoder.encode(preview + '\n'))
    }
    return '(dry-run)'
  } catch (err) {
    spinner.stop()
    throw err
  }
}
