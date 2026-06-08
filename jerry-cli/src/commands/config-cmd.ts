import { Confirm, Input, Secret, Select } from '@cliffy/prompt'
import {
  configFilePath,
  loadConfig,
  maskSecret,
  parseConfigSetting,
  readConfigFile,
  removeConfigValue,
  setConfigValue,
  settingLabel,
  type ConfigSetting,
} from '../config.ts'
import { promptLine, promptSecret } from '../prompt.ts'
import { clearTerminal, pauseEnter } from '../terminal.ts'

function printConfigSummary(): void {
  const cfg = loadConfig()
  const awUrl =
    Deno.env.get('ACTIVITYWATCH_BASE_URL') ?? 'http://localhost:5600/api/0'

  console.log('  Jerry CLI configuration')
  console.log(`  File: ${configFilePath()}`)
  console.log('')
  console.log(`  OpenAI API key  ${maskSecret(cfg.openaiApiKey)}  (${cfg.openaiApiKeySource})`)
  console.log(`  OpenAI model    ${cfg.openaiModel}  (${cfg.openaiModelSource})`)
  console.log(`  Reports dir     ${cfg.reportsDir}  (${cfg.reportsDirSource})`)
  console.log(`  ActivityWatch   ${awUrl}`)
  console.log('')
}

function printConfigHelp(): void {
  console.log('  CLI commands (non-interactive)')
  console.log('  Set:    jerry config set <openai-api-key|reports-dir|openai-model> [value]')
  console.log('  Remove: jerry config remove <openai-api-key|reports-dir|openai-model>')
  console.log('')
  console.log('  Env vars OPENAI_API_KEY and JERRY_REPORTS_DIR override file values.')
  console.log('')
}

export function showConfig(): void {
  printConfigSummary()
  printConfigHelp()
}

type MenuAction =
  | 'set-openai-api-key'
  | 'set-reports-dir'
  | 'set-openai-model'
  | 'remove-openai-api-key'
  | 'remove-reports-dir'
  | 'remove-openai-model'
  | 'view'
  | 'exit'

export async function runConfigMenu(): Promise<void> {
  if (!Deno.stdin.isTerminal() || !Deno.stdout.isTerminal()) {
    showConfig()
    return
  }

  while (true) {
    clearTerminal()
    printConfigSummary()

    const file = readConfigFile()
    const _cfg = loadConfig()

    const choices = [
      {
        name: 'Set OpenAI API key',
        value: 'set-openai-api-key',
      },
      {
        name: 'Set reports directory',
        value: 'set-reports-dir',
      },
      {
        name: 'Set OpenAI model',
        value: 'set-openai-model',
      },
      {
        name: '─────────────────────',
        value: '__separator_1',
      },
      {
        name: file.openaiApiKey ? 'Remove OpenAI API key from file' : 'Remove OpenAI API key from file (disabled)',
        value: file.openaiApiKey ? 'remove-openai-api-key' : '__disabled_1',
      },
      {
        name: file.reportsDir ? 'Remove reports directory from file' : 'Remove reports directory from file (disabled)',
        value: file.reportsDir ? 'remove-reports-dir' : '__disabled_2',
      },
      {
        name: file.openaiModel ? 'Remove OpenAI model from file' : 'Remove OpenAI model from file (disabled)',
        value: file.openaiModel ? 'remove-openai-model' : '__disabled_3',
      },
      {
        name: '─────────────────────',
        value: '__separator_2',
      },
      {
        name: 'View CLI commands',
        value: 'view',
      },
      {
        name: 'Done',
        value: 'exit',
      },
    ].filter(choice => !choice.value.startsWith('__disabled'))

    const action = await Select.prompt({
      message: 'Choose an option (↑↓ navigate, Enter select)',
      options: choices.filter(c => !c.value.startsWith('__separator')).map(c => ({
        name: c.name,
        value: c.value as MenuAction,
      })),
    }) as MenuAction

    if (action === 'exit') {
      clearTerminal()
      console.log('jerry: done')
      break
    }

    try {
      const status = await handleMenuAction(action)
      if (status) {
        clearTerminal()
        console.log('')
        console.log(`  ${status}`)
        console.log('')
        await pauseEnter()
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('User force closed')) {
        clearTerminal()
        console.log('jerry: cancelled')
        break
      }
      clearTerminal()
      const message = err instanceof Error ? err.message : String(err)
      console.error(`jerry: ${message}`)
      await pauseEnter()
    }
  }
}

async function handleMenuAction(action: MenuAction): Promise<string | null> {
  switch (action) {
    case 'set-openai-api-key': {
      const key = await Secret.prompt({
        message: 'OpenAI API key',
        validate: (v: string) => v.trim() ? true : 'API key cannot be empty',
      })
      setConfigValue('openai-api-key', key.trim())
      return `${settingLabel('openai-api-key')} saved (${maskSecret(key.trim())})`
    }
    case 'set-reports-dir': {
      const cfg = loadConfig()
      const dir = await Input.prompt({
        message: 'Reports directory path',
        default: cfg.reportsDir,
        validate: (v: string) => v.trim() ? true : 'Path cannot be empty',
      })
      setConfigValue('reports-dir', dir.trim())
      return `${settingLabel('reports-dir')} saved → ${loadConfig().reportsDir}`
    }
    case 'set-openai-model': {
      const cfg = loadConfig()
      const model = await Input.prompt({
        message: 'OpenAI model ID',
        default: cfg.openaiModel,
        validate: (v: string) => v.trim() ? true : 'Model cannot be empty',
      })
      setConfigValue('openai-model', model.trim())
      return `${settingLabel('openai-model')} saved → ${loadConfig().openaiModel}`
    }
    case 'remove-openai-api-key':
    case 'remove-reports-dir':
    case 'remove-openai-model': {
      const setting = action.replace('remove-', '') as ConfigSetting
      const ok = await Confirm.prompt({
        message: `Remove ${settingLabel(setting)} from config file?`,
        default: false,
      })
      if (!ok) {
        return 'Cancelled'
      }
      removeConfigValue(setting)
      if (setting === 'openai-api-key' && loadConfig().openaiApiKeySource === 'env') {
        return `${settingLabel(setting)} removed from file (OPENAI_API_KEY still set in env)`
      }
      return `${settingLabel(setting)} removed from file`
    }
    case 'view': {
      clearTerminal()
      printConfigHelp()
      await pauseEnter()
      return null
    }
    default:
      return null
  }
}

export async function setConfig(settingRaw: string, value?: string): Promise<void> {
  const setting = parseConfigSetting(settingRaw)

  let resolved = value?.trim() ?? ''
  if (!resolved) {
    if (setting === 'openai-api-key') {
      resolved = Deno.stdin.isTerminal()
        ? await Secret.prompt({ message: 'OpenAI API key' })
        : await promptSecret('OpenAI API key: ')
    } else if (setting === 'reports-dir') {
      resolved = Deno.stdin.isTerminal()
        ? await Input.prompt({ message: 'Reports directory path' })
        : await promptLine('Reports directory path: ')
    } else {
      resolved = Deno.stdin.isTerminal()
        ? await Input.prompt({ message: 'OpenAI model ID' })
        : await promptLine('OpenAI model ID: ')
    }
  }

  setConfigValue(setting, resolved)
  console.log(`jerry: ${settingLabel(setting)} saved to ${configFilePath()}`)
  if (setting === 'openai-api-key') {
    console.log(`jerry: stored as ${maskSecret(resolved)}`)
  }
}

export function removeConfig(settingRaw: string): void {
  const setting = parseConfigSetting(settingRaw)
  removeConfigValue(setting)
  console.log(`jerry: ${settingLabel(setting)} removed from ${configFilePath()}`)
  if (setting === 'openai-api-key') {
    const cfg = loadConfig()
    if (cfg.openaiApiKeySource === 'env') {
      console.log('jerry: OPENAI_API_KEY is still set in your environment')
    }
  }
}
