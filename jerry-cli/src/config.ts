import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DEFAULT_OPENAI_MODEL, isAllowedOpenAiModel } from './llm/models.ts'

export type JerryCliConfig = {
  openaiApiKey: string
  openaiApiKeySource: 'env' | 'file' | 'none'
  openaiModel: string
  openaiModelSource: 'env' | 'file' | 'default'
  reportsDir: string
  reportsDirSource: 'env' | 'file' | 'default'
}

export type CliJsonFile = {
  openaiApiKey?: string
  openaiModel?: string
  reportsDir?: string
}

export type ConfigSetting = 'openai-api-key' | 'reports-dir' | 'openai-model'

const CONFIG_DIR = path.join(
  Deno.env.get('XDG_CONFIG_HOME') ?? path.join(os.homedir(), '.config'),
  'jerry'
)
const CONFIG_FILE = path.join(CONFIG_DIR, 'cli.json')

const DEFAULT_REPORTS_DIR = path.join(os.homedir(), 'Documents', 'jerry-reports')

function expandHome(p: string): string {
  if (p.startsWith('~/')) {
    return path.join(os.homedir(), p.slice(2))
  }
  return p
}

function collapseHome(p: string): string {
  const home = os.homedir()
  if (p === home) return '~'
  if (p.startsWith(home + path.sep)) {
    return '~' + p.slice(home.length)
  }
  return p
}

export function configFilePath(): string {
  return CONFIG_FILE
}

export function readConfigFile(): CliJsonFile {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf8')
    return JSON.parse(raw) as CliJsonFile
  } catch {
    return {}
  }
}

function writeConfigFile(data: CliJsonFile): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(data, null, 2) + '\n', {
    encoding: 'utf8',
    mode: 0o600,
  })
}

export function maskSecret(value: string): string {
  if (!value) return '(not set)'
  if (value.length <= 10) return '********'
  return `${value.slice(0, 7)}…${value.slice(-4)}`
}

export function loadConfig(): JerryCliConfig {
  const file = readConfigFile()

  const envKey = Deno.env.get('OPENAI_API_KEY')?.trim() ?? ''
  const fileKey = file.openaiApiKey?.trim() ?? ''
  let openaiApiKey = ''
  let openaiApiKeySource: JerryCliConfig['openaiApiKeySource'] = 'none'
  if (envKey) {
    openaiApiKey = envKey
    openaiApiKeySource = 'env'
  } else if (fileKey) {
    openaiApiKey = fileKey
    openaiApiKeySource = 'file'
  }

  const envModel = Deno.env.get('OPENAI_MODEL')?.trim()
  const fileModel = file.openaiModel?.trim()
  let openaiModel = DEFAULT_OPENAI_MODEL
  let openaiModelSource: JerryCliConfig['openaiModelSource'] = 'default'
  if (envModel) {
    openaiModel = isAllowedOpenAiModel(envModel) ? envModel : DEFAULT_OPENAI_MODEL
    openaiModelSource = 'env'
  } else if (fileModel) {
    openaiModel = isAllowedOpenAiModel(fileModel) ? fileModel : DEFAULT_OPENAI_MODEL
    openaiModelSource = 'file'
  }

  const reportsFromEnv = Deno.env.get('JERRY_REPORTS_DIR')?.trim()
  const reportsFromFile = file.reportsDir?.trim()
  let reportsDir = DEFAULT_REPORTS_DIR
  let reportsDirSource: JerryCliConfig['reportsDirSource'] = 'default'
  if (reportsFromEnv) {
    reportsDir = expandHome(reportsFromEnv)
    reportsDirSource = 'env'
  } else if (reportsFromFile) {
    reportsDir = expandHome(reportsFromFile)
    reportsDirSource = 'file'
  }

  return {
    openaiApiKey,
    openaiApiKeySource,
    openaiModel,
    openaiModelSource,
    reportsDir,
    reportsDirSource,
  }
}

export function ensureReportsDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true })
}

export function setConfigValue(setting: ConfigSetting, value: string): void {
  const file = readConfigFile()

  switch (setting) {
    case 'openai-api-key': {
      const key = value.trim()
      if (!key) {
        throw new Error('API key cannot be empty')
      }
      file.openaiApiKey = key
      break
    }
    case 'reports-dir': {
      const dir = expandHome(value.trim())
      if (!dir) {
        throw new Error('Reports directory cannot be empty')
      }
      file.reportsDir = collapseHome(dir)
      break
    }
    case 'openai-model': {
      const model = value.trim()
      if (!isAllowedOpenAiModel(model)) {
        throw new Error(`Unknown model "${model}". Use a supported OpenAI model ID.`)
      }
      file.openaiModel = model
      break
    }
    default:
      throw new Error(`Unknown setting: ${setting}`)
  }

  writeConfigFile(file)
}

export function removeConfigValue(setting: ConfigSetting): void {
  const file = readConfigFile()

  switch (setting) {
    case 'openai-api-key':
      delete file.openaiApiKey
      break
    case 'reports-dir':
      delete file.reportsDir
      break
    case 'openai-model':
      delete file.openaiModel
      break
    default:
      throw new Error(`Unknown setting: ${setting}`)
  }

  writeConfigFile(file)
}

export function parseConfigSetting(raw: string): ConfigSetting {
  const normalized = raw.trim().toLowerCase()
  if (normalized === 'openai-api-key' || normalized === 'api-key') {
    return 'openai-api-key'
  }
  if (normalized === 'reports-dir' || normalized === 'report-path' || normalized === 'reports') {
    return 'reports-dir'
  }
  if (normalized === 'openai-model' || normalized === 'model') {
    return 'openai-model'
  }
  throw new Error(
    `Unknown setting "${raw}". Use: openai-api-key, reports-dir, openai-model`
  )
}

export function settingLabel(setting: ConfigSetting): string {
  switch (setting) {
    case 'openai-api-key':
      return 'OpenAI API key'
    case 'reports-dir':
      return 'Reports directory'
    case 'openai-model':
      return 'OpenAI model'
  }
}
