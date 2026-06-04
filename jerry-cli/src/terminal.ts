import { input } from '@inquirer/prompts'

/** Full terminal reset — avoids stacked menu output between interactions. */
export function clearTerminal(): void {
  if (process.stdout.isTTY) {
    process.stdout.write('\x1Bc')
  }
}

export async function pauseEnter(message = 'Press Enter to continue'): Promise<void> {
  await input({ message })
}
