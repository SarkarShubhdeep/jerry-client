export {
  DEFAULT_OPENAI_MODEL,
  OPENAI_MODEL_GROUPS,
  OPENAI_MODELS,
  OPENAI_MODEL_IDS,
  type OpenAiModelId,
  isAllowedOpenAiModel,
} from '../../shared/openai-models'

import { OPENAI_MODELS } from '../../shared/openai-models'

export function getOpenAiModelLabel(modelId: string): string {
  const match = OPENAI_MODELS.find((model) => model.id === modelId)
  return match?.label ?? modelId
}
