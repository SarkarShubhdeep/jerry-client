export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

export const OPENAI_MODEL_IDS = [
  'gpt-5.5',
  'gpt-5.5-pro',
  'gpt-5.4',
  'gpt-5.4-mini',
  'gpt-5.4-nano',
  'gpt-5.2',
  'gpt-5-mini',
  'gpt-5-nano',
  'o4-mini',
  'o3-mini',
  'o3',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
] as const

export type OpenAiModelId = (typeof OPENAI_MODEL_IDS)[number]

export function isAllowedOpenAiModel(model: string): model is OpenAiModelId {
  return (OPENAI_MODEL_IDS as readonly string[]).includes(model)
}
