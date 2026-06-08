import { Input } from '@cliffy/prompt'

/** Full terminal reset — avoids stacked menu output between interactions. */
export function clearTerminal(): void {
  if (Deno.stdout.isTerminal()) {
    Deno.stdout.writeSync(new TextEncoder().encode('\x1Bc'))
  }
}

export async function pauseEnter(message = 'Press Enter to continue'): Promise<void> {
  await Input.prompt({ message })
}
