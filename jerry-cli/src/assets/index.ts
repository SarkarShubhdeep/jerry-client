import path from 'node:path'
import { fileURLToPath } from 'node:url'
import a3t, { type FsBackend } from 'a3t'
import { resolveA3tOverrideDir } from '../config.ts'

// Shipped defaults live in jerry-cli/assets/ (resolved from this module, not cwd).
const SHIPPED_ASSETS_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../assets',
)

export type AssetsInitOptions = {
  overridePath?: string
  shippedRoot?: string
}

async function readTextFromRoot(rootPath: string, key: string): Promise<string | null> {
  try {
    const fullPath = path.join(rootPath, key)
    const resolvedPath = path.resolve(fullPath)
    const resolvedRoot = path.resolve(rootPath)

    if (
      resolvedPath !== resolvedRoot &&
      !resolvedPath.startsWith(resolvedRoot + path.sep)
    ) {
      return null
    }

    return await Deno.readTextFile(fullPath)
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null
    return null
  }
}

async function readBinaryFromRoot(rootPath: string, key: string): Promise<Uint8Array | null> {
  try {
    const fullPath = path.join(rootPath, key)
    const resolvedPath = path.resolve(fullPath)
    const resolvedRoot = path.resolve(rootPath)

    if (
      resolvedPath !== resolvedRoot &&
      !resolvedPath.startsWith(resolvedRoot + path.sep)
    ) {
      return null
    }

    return await Deno.readFile(fullPath)
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null
    return null
  }
}

class LayeredFsBackend implements FsBackend {
  constructor(
    private overrideRoot: string,
    private shippedRoot: string,
  ) {}

  async readAsset(key: string): Promise<string | null> {
    const override = await readTextFromRoot(this.overrideRoot, key)
    if (override !== null) return override
    return readTextFromRoot(this.shippedRoot, key)
  }

  async readBinaryAsset(key: string): Promise<Uint8Array | null> {
    const override = await readBinaryFromRoot(this.overrideRoot, key)
    if (override !== null) return override
    return readBinaryFromRoot(this.shippedRoot, key)
  }
}

let initialized = false

/**
 * Initialize a3t with a filesystem-only layered backend.
 *
 * Resolution order: local overrides → shipped defaults → inline default passed to getPrompt().
 *
 * Future org-wide overrides can add a database backend here, e.g.:
 *   db: { mongodb: { client, database: 'jerry', collection: 'assets' } }
 * No database backend is configured in v1.
 */
export function initAssets(options?: AssetsInitOptions): void {
  const overrideRoot = options?.overridePath ?? resolveA3tOverrideDir()
  const shippedRoot = options?.shippedRoot ?? SHIPPED_ASSETS_ROOT

  a3t.init({
    fs: {
      backend: new LayeredFsBackend(overrideRoot, shippedRoot),
    },
    logging: { enabled: false },
  })

  initialized = true
}

function ensureAssetsInitialized(): void {
  if (!initialized) initAssets()
}

/** Load a string asset by key with inline fallback when no file exists. */
export async function getPrompt(key: string, defaultValue: string): Promise<string> {
  ensureAssetsInitialized()
  const value = await a3t.get(key, defaultValue)
  return typeof value === 'string' ? value : defaultValue
}

/** Exposed for tests when re-initializing with different roots. */
export function clearAssetCache(): void {
  a3t.clearCache()
}
