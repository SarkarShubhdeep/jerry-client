import Store from 'electron-store'
import { jerryLib } from '../jerry-lib-runtime'

export type Theme = 'light' | 'dark'
export type ApiProvider = 'openai' | 'anthropic'

type SettingsSchema = {
  openaiApiKey: string
  anthropicApiKey: string
  theme: Theme
  openaiModel: string
}

function defaultOpenAiModel(): string {
  return jerryLib().DEFAULT_OPENAI_MODEL
}

const store = new Store<SettingsSchema>({
  name: 'jerry-settings',
  defaults: {
    openaiApiKey: '',
    anthropicApiKey: '',
    theme: 'dark',
    openaiModel: 'gpt-4o-mini',
  },
})

export const PUBLIC_SETTINGS_KEYS = ['theme', 'openaiModel'] as const
export const SECRET_SETTINGS_KEYS = ['openaiApiKey', 'anthropicApiKey'] as const
export const SETTINGS_KEYS = [
  ...PUBLIC_SETTINGS_KEYS,
  ...SECRET_SETTINGS_KEYS,
] as const

export type PublicSettingsKey = (typeof PUBLIC_SETTINGS_KEYS)[number]
export type SecretSettingsKey = (typeof SECRET_SETTINGS_KEYS)[number]
export type SettingsKey = (typeof SETTINGS_KEYS)[number]

export function isSettingsKey(key: string): key is SettingsKey {
  return (SETTINGS_KEYS as readonly string[]).includes(key)
}

export function isPublicSettingsKey(key: string): key is PublicSettingsKey {
  return (PUBLIC_SETTINGS_KEYS as readonly string[]).includes(key)
}

function hasStoredKey(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function migrateEnvApiKeyOnce(): void {
  if (hasStoredKey(store.get('openaiApiKey'))) {
    return
  }
  const fromEnv = process.env.OPENAI_API_KEY
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    store.set('openaiApiKey', fromEnv.trim())
  }
}

export function getApiKey(): string {
  const fromStore = store.get('openaiApiKey')
  if (hasStoredKey(fromStore)) {
    return fromStore.trim()
  }
  return ''
}

export function setApiKey(key: string): void {
  store.set('openaiApiKey', key.trim())
}

export function getTheme(): Theme {
  const theme = store.get('theme')
  return theme === 'light' ? 'light' : 'dark'
}

export function setTheme(theme: Theme): void {
  store.set('theme', theme)
}

export function getModel(): string {
  const { isAllowedOpenAiModel, DEFAULT_OPENAI_MODEL } = jerryLib()
  const model = store.get('openaiModel')
  if (typeof model === 'string' && isAllowedOpenAiModel(model)) {
    return model
  }
  return DEFAULT_OPENAI_MODEL
}

export function setModel(model: string): void {
  const { isAllowedOpenAiModel } = jerryLib()
  if (!isAllowedOpenAiModel(model)) {
    throw new Error('Invalid OpenAI model')
  }
  store.set('openaiModel', model)
}

export function isApiKeyConfigured(provider: ApiProvider): boolean {
  if (provider === 'openai') {
    return hasStoredKey(store.get('openaiApiKey'))
  }
  return hasStoredKey(store.get('anthropicApiKey'))
}

export function getApiKeyConfiguration(): { openai: boolean; anthropic: boolean } {
  return {
    openai: isApiKeyConfigured('openai'),
    anthropic: isApiKeyConfigured('anthropic'),
  }
}

export function getPublicSetting(key: PublicSettingsKey): string {
  if (key === 'theme') {
    return getTheme()
  }
  return getModel()
}

export function setSetting(key: SettingsKey, value: string): void {
  switch (key) {
    case 'openaiApiKey':
      setApiKey(value)
      break
    case 'anthropicApiKey':
      store.set('anthropicApiKey', value.trim())
      break
    case 'theme': {
      const theme = value === 'light' ? 'light' : 'dark'
      setTheme(theme)
      break
    }
    case 'openaiModel':
      setModel(value)
      break
    default:
      break
  }
}

// Used after initJerryLibRuntime to align store default with lib constant.
export function syncDefaultModelFromLib(): void {
  const model = store.get('openaiModel')
  if (typeof model !== 'string' || !model.trim()) {
    store.set('openaiModel', defaultOpenAiModel())
  }
}
