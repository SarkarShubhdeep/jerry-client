/** Keep OPENAI_MODEL_IDS in sync with @sarkarshubhdeep/jerry-lib when adding models. */
export const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini'

export const OPENAI_MODEL_GROUPS = [
  {
    label: 'GPT-5.5',
    models: [
      { id: 'gpt-5.5', label: 'GPT-5.5' },
      { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro' },
    ],
  },
  {
    label: 'GPT-5.4',
    models: [
      { id: 'gpt-5.4', label: 'GPT-5.4' },
      { id: 'gpt-5.4-mini', label: 'GPT-5.4 mini' },
      { id: 'gpt-5.4-nano', label: 'GPT-5.4 nano' },
    ],
  },
  {
    label: 'GPT-5',
    models: [
      { id: 'gpt-5.2', label: 'GPT-5.2' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini' },
      { id: 'gpt-5-nano', label: 'GPT-5 nano' },
    ],
  },
  {
    label: 'Reasoning',
    models: [
      { id: 'o4-mini', label: 'o4-mini' },
      { id: 'o3-mini', label: 'o3-mini' },
      { id: 'o3', label: 'o3' },
    ],
  },
  {
    label: 'GPT-4.1',
    models: [
      { id: 'gpt-4.1', label: 'GPT-4.1' },
      { id: 'gpt-4.1-mini', label: 'GPT-4.1 mini' },
      { id: 'gpt-4.1-nano', label: 'GPT-4.1 nano' },
    ],
  },
  {
    label: 'GPT-4o',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o' },
      { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
    ],
  },
] as const

export const OPENAI_MODELS = OPENAI_MODEL_GROUPS.flatMap((group) =>
  group.models.map((model) => ({ ...model, group: group.label }))
)

export const OPENAI_MODEL_IDS = OPENAI_MODELS.map((model) => model.id)

export type OpenAiModelId = (typeof OPENAI_MODELS)[number]['id']

export function isAllowedOpenAiModel(model: string): model is OpenAiModelId {
  return (OPENAI_MODEL_IDS as readonly string[]).includes(model)
}

export function getOpenAiModelLabel(modelId: string): string {
  const match = OPENAI_MODELS.find((model) => model.id === modelId)
  return match?.label ?? modelId
}
