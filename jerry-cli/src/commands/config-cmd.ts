import { confirm, input, password, select, Separator } from '@inquirer/prompts'
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
} from '../config.js'
import { promptLine, promptSecret } from '../prompt.js'
import { clearTerminal, pauseEnter } from '../terminal.js'

function printConfigSummary(): void {
  const cfg = loadConfig()
  const awUrl =
    process.env.ACTIVITYWATCH_BASE_URL ?? 'http://localhost:5600/api/0'

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
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    showConfig()
    return
  }

  while (true) {
    clearTerminal()
    printConfigSummary()

    const file = readConfigFile()
    const cfg = loadConfig()

    const action = await select<MenuAction>({
      message: 'Choose an option (↑↓ navigate, Enter select)',
      loop: false,
      choices: [
        {
          name: 'Set OpenAI API key',
          value: 'set-openai-api-key',
          description: cfg.openaiApiKey
            ? `Current: ${maskSecret(cfg.openaiApiKey)}`
            : 'Not configured',
        },
        {
          name: 'Set reports directory',
          value: 'set-reports-dir',
          description: cfg.reportsDir,
        },
        {
          name: 'Set OpenAI model',
          value: 'set-openai-model',
          description: cfg.openaiModel,
        },
        new Separator(),
        {
          name: 'Remove OpenAI API key from file',
          value: 'remove-openai-api-key',
          disabled: !file.openaiApiKey,
        },
        {
          name: 'Remove reports directory from file',
          value: 'remove-reports-dir',
          disabled: !file.reportsDir,
        },
        {
          name: 'Remove OpenAI model from file',
          value: 'remove-openai-model',
          disabled: !file.openaiModel,
        },
        new Separator(),
        {
          name: 'View CLI commands',
          value: 'view',
        },
        {
          name: 'Done',
          value: 'exit',
        },
      ],
    })

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
      const key = await password({
        message: 'OpenAI API key',
        mask: '*',
        validate: (v) => (v.trim() ? true : 'API key cannot be empty'),
      })
      setConfigValue('openai-api-key', key.trim())
      return `${settingLabel('openai-api-key')} saved (${maskSecret(key.trim())})`
    }
    case 'set-reports-dir': {
      const cfg = loadConfig()
      const dir = await input({
        message: 'Reports directory path',
        default: cfg.reportsDir,
        validate: (v) => (v.trim() ? true : 'Path cannot be empty'),
      })
      setConfigValue('reports-dir', dir.trim())
      return `${settingLabel('reports-dir')} saved → ${loadConfig().reportsDir}`
    }
    case 'set-openai-model': {
      const cfg = loadConfig()
      const model = await input({
        message: 'OpenAI model ID',
        default: cfg.openaiModel,
        validate: (v) => (v.trim() ? true : 'Model cannot be empty'),
      })
      setConfigValue('openai-model', model.trim())
      return `${settingLabel('openai-model')} saved → ${loadConfig().openaiModel}`
    }
    case 'remove-openai-api-key':
    case 'remove-reports-dir':
    case 'remove-openai-model': {
      const setting = action.replace('remove-', '') as ConfigSetting
      const ok = await confirm({
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
      resolved = process.stdin.isTTY
        ? await password({ message: 'OpenAI API key', mask: '*' })
        : await promptSecret('OpenAI API key: ')
    } else if (setting === 'reports-dir') {
      resolved = process.stdin.isTTY
        ? await input({ message: 'Reports directory path' })
        : await promptLine('Reports directory path: ')
    } else {
      resolved = process.stdin.isTTY
        ? await input({ message: 'OpenAI model ID' })
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
