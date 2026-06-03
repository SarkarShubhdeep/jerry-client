import Store from 'electron-store'

type SettingsSchema = {
  openaiApiKey: string
}

const store = new Store<SettingsSchema>({
  name: 'jerry-settings',
  defaults: {
    openaiApiKey: '',
  },
})

export function getApiKey(): string {
  const fromStore = store.get('openaiApiKey')
  if (typeof fromStore === 'string' && fromStore.trim()) {
    return fromStore.trim()
  }
  const fromEnv = process.env.OPENAI_API_KEY
  if (typeof fromEnv === 'string' && fromEnv.trim()) {
    return fromEnv.trim()
  }
  return ''
}

export function setApiKey(key: string): void {
  store.set('openaiApiKey', key.trim())
}

export function getSetting(key: keyof SettingsSchema): string {
  if (key === 'openaiApiKey') {
    return store.get('openaiApiKey') ?? ''
  }
  return ''
}

export function setSetting(key: keyof SettingsSchema, value: string): void {
  if (key === 'openaiApiKey') {
    setApiKey(value)
  }
}

export const SETTINGS_KEYS = ['openaiApiKey'] as const
export type SettingsKey = (typeof SETTINGS_KEYS)[number]

export function isSettingsKey(key: string): key is SettingsKey {
  return (SETTINGS_KEYS as readonly string[]).includes(key)
}
