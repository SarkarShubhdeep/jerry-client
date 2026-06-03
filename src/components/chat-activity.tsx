'use client'

import { Check, Loader2 } from 'lucide-react'
import type { LlmStatusPhase } from '@/types/llm'

export type ChatActivityStep = {
  phase: LlmStatusPhase
  label: string
  state: 'active' | 'done'
}

type ChatActivityProps = {
  steps: ChatActivityStep[]
}

export function ChatActivity({ steps }: ChatActivityProps) {
  if (steps.length === 0) return null

  return (
    <div
      className="mr-8 space-y-1.5 rounded-lg border border-dashed bg-muted/30 px-3 py-2"
      aria-label="Assistant activity"
    >
      {steps.map((step) => (
        <div key={step.phase} className="flex items-center gap-2 text-xs">
          {step.state === 'active' ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
          ) : (
            <Check className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
          <span
            className={
              step.state === 'done' ? 'text-muted-foreground' : 'text-foreground'
            }
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
