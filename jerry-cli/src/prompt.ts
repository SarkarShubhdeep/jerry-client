import { Input, Secret } from '@cliffy/prompt'

export async function promptLine(question: string): Promise<string> {
  return await Input.prompt({ message: question })
}

/** Hidden stdin prompt for secrets (no echo). */
export async function promptSecret(question: string): Promise<string> {
  return await Secret.prompt({ message: question })
}
