import { assertEquals } from 'jsr:@std/assert@^1.0.13'
import { clearAssetCache, getPrompt, initAssets } from './index.ts'

const TEST_KEY = 'prompts/test.txt'

Deno.test('getPrompt returns inline default when no asset files exist', async () => {
  const shippedRoot = await Deno.makeTempDir()
  const overrideRoot = await Deno.makeTempDir()

  initAssets({ shippedRoot, overridePath: overrideRoot })
  clearAssetCache()

  const value = await getPrompt(TEST_KEY, 'default')
  assertEquals(value, 'default')

  await Deno.remove(shippedRoot, { recursive: true })
  await Deno.remove(overrideRoot, { recursive: true })
})

Deno.test('getPrompt prefers local override over shipped default and inline default', async () => {
  const shippedRoot = await Deno.makeTempDir()
  const overrideRoot = await Deno.makeTempDir()

  await Deno.mkdir(`${overrideRoot}/prompts`, { recursive: true })
  await Deno.writeTextFile(`${overrideRoot}/prompts/test.txt`, 'override')

  initAssets({ shippedRoot, overridePath: overrideRoot })
  clearAssetCache()

  const value = await getPrompt(TEST_KEY, 'default')
  assertEquals(value, 'override')

  await Deno.remove(shippedRoot, { recursive: true })
  await Deno.remove(overrideRoot, { recursive: true })
})

Deno.test('getPrompt uses shipped default when override is missing', async () => {
  const shippedRoot = await Deno.makeTempDir()
  const overrideRoot = await Deno.makeTempDir()

  await Deno.mkdir(`${shippedRoot}/prompts`, { recursive: true })
  await Deno.writeTextFile(`${shippedRoot}/prompts/test.txt`, 'shipped')

  initAssets({ shippedRoot, overridePath: overrideRoot })
  clearAssetCache()

  const value = await getPrompt(TEST_KEY, 'default')
  assertEquals(value, 'shipped')

  await Deno.remove(shippedRoot, { recursive: true })
  await Deno.remove(overrideRoot, { recursive: true })
})
