#!/usr/bin/env -S deno run --allow-net --allow-read --allow-write --allow-env --allow-sys
import { load as loadDotenv } from '@std/dotenv'
import { Command } from '@cliffy/command'
import { initJerryLib } from '@jerry/lib'
import { runAsk } from './commands/ask.ts'
import { runReport } from './commands/report.ts'
import { removeConfig, runConfigMenu, setConfig, showConfig } from './commands/config-cmd.ts'
import { resolveA3tOverrideDir } from './config.ts'

initJerryLib({ assets: { overridePath: resolveA3tOverrideDir() } })

// Load .env file if it exists in the jerry-cli directory
const jerryCliDir = new URL('.', import.meta.url).pathname.replace('/src/', '/')
try {
  await loadDotenv({ envPath: `${jerryCliDir}/.env`, export: true })
} catch {
  // .env file doesn't exist, that's okay
}

const pkg = { version: '0.1.0' }

await new Command()
  .name('jerry')
  .description('Jerry CLI — ActivityWatch work reports and LLM chat')
  .version(pkg.version)
  .command('ask', 'Ask the configured OpenAI model a question (no ActivityWatch)')
  .arguments('[question...]')
  .action(async (_options, ...parts: string[]) => {
    try {
      await runAsk(parts.join(' '))
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      Deno.exit(1)
    }
  })
  .command(
    'report',
    'Generate a work report from ActivityWatch. Examples: jerry report today (midnight→now), jerry report yesterday (prior day), jerry report "May 13 to May 20" (custom range). Saves .md unless --stdout.',
  )
  .arguments('[prompt...]')
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
  .command(
    'config',
    new Command()
      .description('Manage configuration settings')
      .command('show', 'Print configuration (non-interactive)')
      .action(() => {
        showConfig()
      })
      .command('set', 'Save a setting (prompts if value omitted)')
      .arguments('<setting:string> [value:string]')
      .action(async (_opts, setting: string, value?: string) => {
        try {
          await setConfig(setting, value)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`jerry: ${message}`)
          Deno.exit(1)
        }
      })
      .command('remove', 'Remove a setting from the config file')
      .arguments('<setting:string>')
      .action((_opts, setting: string) => {
        try {
          removeConfig(setting)
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`jerry: ${message}`)
          Deno.exit(1)
        }
      })
      .command('menu', 'Interactive settings menu')
      .action(async () => {
        try {
          await runConfigMenu()
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err)
          console.error(`jerry: ${message}`)
          Deno.exit(1)
        }
      }),
  )
  .parse(Deno.args)
