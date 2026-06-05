#!/usr/bin/env node
import { config as loadDotenv } from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import { runAsk } from './commands/ask.js'
import { runReport } from './commands/report.js'
import {
  removeConfig,
  runConfigMenu,
  setConfig,
  showConfig,
} from './commands/config-cmd.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
loadDotenv({ path: path.join(__dirname, '..', '.env'), quiet: true })

const pkg = { version: '0.1.0' }

const program = new Command()
  .name('jerry')
  .description('Jerry CLI — ActivityWatch work reports and LLM chat')
  .version(pkg.version)

program
  .command('ask')
  .description('Ask the configured OpenAI model a question (no ActivityWatch)')
  .argument('[question...]', 'Your question')
  .action(async (parts: string[]) => {
    try {
      await runAsk(parts.join(' '))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      process.exitCode = 1
    }
  })

program
  .command('report')
  .description('Generate a work report from ActivityWatch (stateless, saves .md)')
  .argument('[prompt...]', 'Natural-language report request')
  .option('--hours <n>', 'ActivityWatch range in hours (overrides prompt parsing)', parseFloat)
  .option('--dry-run', 'Fetch and print AW context only; no LLM call')
  .option('--stdout', 'Print markdown to stdout instead of writing a file')
  .action(async (promptParts: string[], opts) => {
    try {
      const prompt = promptParts.join(' ').trim()
      const result = await runReport({
        prompt,
        hours: opts.hours,
        dryRun: opts.dryRun,
        stdout: opts.stdout,
      })
      if (result !== '(stdout)' && result !== '(dry-run)') {
        console.log(result)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      process.exitCode = 1
    }
  })

const configCmd = program
  .command('config')
  .description('Interactive settings menu (~/.config/jerry/cli.json)')

configCmd.action(async () => {
  try {
    await runConfigMenu()
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`jerry: ${message}`)
    process.exitCode = 1
  }
})

configCmd
  .command('show')
  .description('Print configuration (non-interactive)')
  .action(() => {
    showConfig()
  })

configCmd
  .command('set <setting> [value]')
  .description('Save a setting (prompts if value omitted)')
  .action(async (setting: string, value?: string) => {
    try {
      await setConfig(setting, value)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      process.exitCode = 1
    }
  })

configCmd
  .command('remove <setting>')
  .description('Remove a setting from the config file')
  .action((setting: string) => {
    try {
      removeConfig(setting)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      process.exitCode = 1
    }
  })

program.parse()
