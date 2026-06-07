#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env
import { load as loadDotenv } from '@std/dotenv'
import { Command } from '@cliffy/command'
import { runAsk } from './commands/ask.js'
import { runReport } from './commands/report.js'
import {
  removeConfig,
  runConfigMenu,
  setConfig,
  showConfig,
} from './commands/config-cmd.js'

// Load .env file if it exists in the jerry-cli directory
const jerryCliDir = new URL('.', import.meta.url).pathname.replace('/src/', '/')
try {
  await loadDotenv({ envPath: `${jerryCliDir}/.env`, export: true })
} catch {
  // .env file doesn't exist, that's okay
}

const pkg = { version: '0.1.0' }

const program = new Command()
  .name('jerry')
  .description('Jerry CLI — ActivityWatch work reports and LLM chat')
  .version(pkg.version)

program
  .command('ask [question...]')
  .description('Ask the configured OpenAI model a question (no ActivityWatch)')
  .action(async (_options, ...parts: string[]) => {
    try {
      await runAsk(parts.join(' '))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      Deno.exit(1)
    }
  })

program
  .command('report [prompt...]')
  .description('Generate a work report from ActivityWatch (stateless, saves .md)')
  .option('--hours <n:number>', 'ActivityWatch range in hours (overrides prompt parsing)')
  .option('--dry-run', 'Fetch and print AW context only; no LLM call')
  .option('--stdout', 'Print markdown to stdout instead of writing a file')
  .action(async (opts, ...promptParts: string[]) => {
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
      Deno.exit(1)
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
    Deno.exit(1)
  }
})

configCmd
  .command('show')
  .description('Print configuration (non-interactive)')
  .action(() => {
    showConfig()
  })

configCmd
  .command('set <setting:string> [value:string]')
  .description('Save a setting (prompts if value omitted)')
  .action(async (_opts, setting: string, value?: string) => {
    try {
      await setConfig(setting, value)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      Deno.exit(1)
    }
  })

configCmd
  .command('remove <setting:string>')
  .description('Remove a setting from the config file')
  .action((_opts, setting: string) => {
    try {
      removeConfig(setting)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      Deno.exit(1)
    }
  })

await program.parse(Deno.args)
