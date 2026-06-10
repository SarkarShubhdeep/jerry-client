import { getPrompt } from '../assets/index.ts'

const ASK_KEY = 'prompts/ask.txt'
const REPORT_KEY = 'prompts/report.txt'
const RECHECK_KEY = 'prompts/recheck.txt'

function injectPromptVars(
  template: string,
  vars: { modelId?: string; activityContext?: string },
): string {
  let result = template
  if (vars.modelId !== undefined) {
    result = result.replace(/\{\{modelId\}\}/g, vars.modelId)
  }
  if (vars.activityContext !== undefined) {
    result = result.replace(/\{\{activityContext\}\}/g, vars.activityContext.trim())
  }
  return result
}

export async function getAskPrompt(modelId: string): Promise<string> {
  const template = await getPrompt(ASK_KEY, '')
  return injectPromptVars(template, { modelId })
}

export async function getReportPrompt(
  modelId: string,
  activityContext: string,
): Promise<string> {
  const template = await getPrompt(REPORT_KEY, '')
  return injectPromptVars(template, { modelId, activityContext })
}

export async function getRecheckPrompt(
  modelId: string,
  activityContext: string,
): Promise<string> {
  const template = await getPrompt(RECHECK_KEY, '')
  return injectPromptVars(template, { modelId, activityContext })
}
