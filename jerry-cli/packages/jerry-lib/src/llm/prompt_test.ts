import { assertEquals, assertStringIncludes } from 'jsr:@std/assert@^1.0.13'
import { clearAssetCache, initAssets } from '../assets/index.ts'
import { getAskPrompt, getRecheckPrompt, getReportPrompt } from './prompt.ts'

async function withTempAssetRoots(
  fn: (roots: { shippedRoot: string; overrideRoot: string }) => Promise<void>,
): Promise<void> {
  const shippedRoot = await Deno.makeTempDir()
  const overrideRoot = await Deno.makeTempDir()
  try {
    await fn({ shippedRoot, overrideRoot })
  } finally {
    await Deno.remove(shippedRoot, { recursive: true })
    await Deno.remove(overrideRoot, { recursive: true })
  }
}

Deno.test('getAskPrompt uses shipped ask.txt and injects modelId', async () => {
  await withTempAssetRoots(async ({ shippedRoot, overrideRoot }) => {
    await Deno.mkdir(`${shippedRoot}/prompts`, { recursive: true })
    await Deno.writeTextFile(
      `${shippedRoot}/prompts/ask.txt`,
      'You are Jerry, a helpful command-line assistant.\n\nModel: {{modelId}}',
    )

    initAssets({ shippedRoot, overridePath: overrideRoot })
    clearAssetCache()

    const prompt = await getAskPrompt('gpt-test')
    assertStringIncludes(prompt, 'gpt-test')
    assertStringIncludes(prompt, 'You are Jerry, a helpful command-line assistant.')
  })
})

Deno.test('getAskPrompt loads repo shipped default ask.txt', async () => {
  initAssets()
  clearAssetCache()

  const prompt = await getAskPrompt('test-model')
  assertStringIncludes(prompt, 'test-model')
  assertStringIncludes(prompt, 'You are Jerry, a helpful command-line assistant.')
  assertStringIncludes(prompt, 'work-report feature')
})

Deno.test('getAskPrompt prefers local override and injects modelId', async () => {
  await withTempAssetRoots(async ({ shippedRoot, overrideRoot }) => {
    await Deno.mkdir(`${overrideRoot}/prompts`, { recursive: true })
    await Deno.writeTextFile(
      `${overrideRoot}/prompts/ask.txt`,
      'Custom Jerry. Model: {{modelId}}',
    )

    initAssets({ shippedRoot, overridePath: overrideRoot })
    clearAssetCache()

    const prompt = await getAskPrompt('override-model')
    assertEquals(prompt, 'Custom Jerry. Model: override-model')
  })
})

Deno.test('getReportPrompt injects trimmed activityContext from override', async () => {
  await withTempAssetRoots(async ({ shippedRoot, overrideRoot }) => {
    await Deno.mkdir(`${overrideRoot}/prompts`, { recursive: true })
    await Deno.writeTextFile(
      `${overrideRoot}/prompts/report.txt`,
      'Report for {{modelId}}.\n\n{{activityContext}}',
    )

    initAssets({ shippedRoot, overridePath: overrideRoot })
    clearAssetCache()

    const prompt = await getReportPrompt('report-model', '  AW context here  ')
    assertEquals(prompt, 'Report for report-model.\n\nAW context here')
  })
})

Deno.test('getRecheckPrompt injects trimmed activityContext from override', async () => {
  await withTempAssetRoots(async ({ shippedRoot, overrideRoot }) => {
    await Deno.mkdir(`${overrideRoot}/prompts`, { recursive: true })
    await Deno.writeTextFile(
      `${overrideRoot}/prompts/recheck.txt`,
      'Recheck {{modelId}}.\n\n{{activityContext}}',
    )

    initAssets({ shippedRoot, overridePath: overrideRoot })
    clearAssetCache()

    const prompt = await getRecheckPrompt('recheck-model', '  draft context  ')
    assertEquals(prompt, 'Recheck recheck-model.\n\ndraft context')
  })
})
