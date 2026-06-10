import { type AssetsInitOptions, initAssets } from './assets/index.ts'

export type JerryLibInitOptions = {
  /** a3t layered filesystem roots. Call once per process before using ask/report. */
  assets?: AssetsInitOptions
}

let initialized = false

/**
 * Optional one-time setup. Prompt loading auto-initializes with shipped defaults
 * when assets options are omitted; pass overridePath for user-local prompt overrides.
 */
export function initJerryLib(options?: JerryLibInitOptions): void {
  if (options?.assets) {
    initAssets(options.assets)
    initialized = true
    return
  }
  if (!initialized) {
    initAssets()
    initialized = true
  }
}
