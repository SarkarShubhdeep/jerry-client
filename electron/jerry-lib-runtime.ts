type JerryLibModule = typeof import('@sarkarshubhdeep/jerry-lib')

let lib: JerryLibModule | undefined

export type JerryLlmConfig = {
  apiKey: string
  model: string
}

export type ReportPhase = 'writing' | 'rechecking'

export async function initJerryLibRuntime(options: {
  assets?: { overridePath?: string; shippedRoot?: string }
}): Promise<void> {
  lib = await import('@sarkarshubhdeep/jerry-lib')
  lib.initJerryLib(options)
}

export function jerryLib(): JerryLibModule {
  if (!lib) {
    throw new Error('jerry-lib is not initialized')
  }
  return lib
}
