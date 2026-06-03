import { ipcMain, type WebContents } from 'electron'
import { chat } from '../llm/client'
import type { LlmStatusUpdate } from '../llm/status'
import type { ChatMessage, ChatRequest, ChatResponse } from '../llm/types'
import { getApiKey } from '../store/settings'
import type { IpcResult } from './aw'

function sendStatus(sender: WebContents, update: LlmStatusUpdate): void {
  sender.send('jerry:llm:status', update)
}

const VALID_ROLES = new Set<ChatMessage['role']>(['user', 'assistant', 'system'])

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) {
    return null
  }

  const messages: ChatMessage[] = []
  for (const item of raw) {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('role' in item) ||
      !('content' in item)
    ) {
      return null
    }
    const role = (item as { role: unknown }).role
    const content = (item as { content: unknown }).content
    if (
      typeof role !== 'string' ||
      !VALID_ROLES.has(role as ChatMessage['role']) ||
      typeof content !== 'string' ||
      !content.trim()
    ) {
      return null
    }
    messages.push({ role: role as ChatMessage['role'], content: content.trim() })
  }

  return messages
}

export function registerLlmIpc(): void {
  ipcMain.handle(
    'jerry:llm:chat',
    async (event, args: ChatRequest): Promise<IpcResult<ChatResponse>> => {
      const messages = parseMessages(args?.messages)
      if (!messages) {
        return { ok: false, error: 'Invalid chat messages' }
      }

      if (!getApiKey()) {
        return {
          ok: false,
          error:
            'OpenAI API key is not configured. Add it in settings or set OPENAI_API_KEY in .env.',
        }
      }

      try {
        const data = await chat(messages, (update) => sendStatus(event.sender, update))
        return { ok: true, data }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { ok: false, error: message }
      }
    }
  )
}
