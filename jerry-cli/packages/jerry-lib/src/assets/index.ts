import path from 'node:path'
import { fileURLToPath } from 'node:url'
import a3t, { type FsBackend } from 'a3t'

const SHIPPED_ASSETS_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../assets',
)

export type AssetsInitOptions = {
  /** User-local override directory (e.g. ~/.config/jerry/assets). */
  overridePath?: string
  /** Shipped defaults root; defaults to packages/jerry-lib/assets. */
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
    private overrideRoot: string | undefined,
    private shippedRoot: string,
  ) {}

  async readAsset(key: string): Promise<string | null> {
    if (this.overrideRoot) {
      const override = await readTextFromRoot(this.overrideRoot, key)
      if (override !== null) return override
    }
    return readTextFromRoot(this.shippedRoot, key)
  }

  async readBinaryAsset(key: string): Promise<Uint8Array | null> {
    if (this.overrideRoot) {
      const override = await readBinaryFromRoot(this.overrideRoot, key)
      if (override !== null) return override
    }
    return readBinaryFromRoot(this.shippedRoot, key)
  }
}

let initialized = false

/**
 * Initialize a3t with a layered filesystem backend.
 * Resolution: local override → shipped defaults → inline fallback in getPrompt().
 */
export function initAssets(options?: AssetsInitOptions): void {
  const shippedRoot = options?.shippedRoot ?? SHIPPED_ASSETS_ROOT

  a3t.init({
    fs: {
      backend: new LayeredFsBackend(options?.overridePath, shippedRoot),
    },
    logging: { enabled: false },
  })

  initialized = true
}

function ensureAssetsInitialized(): void {
  if (!initialized) initAssets()
}

export async function getPrompt(key: string, defaultValue: string): Promise<string> {
  ensureAssetsInitialized()
  const value = await a3t.get(key, defaultValue)
  return typeof value === 'string' ? value : defaultValue
}

export function clearAssetCache(): void {
  a3t.clearCache()
}
