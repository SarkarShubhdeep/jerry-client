'use client'

import { useCallback, useEffect, useRef } from 'react'

const MAX_LINES = 4
const MIN_LINES = 1

export function useAutoResizeTextarea(value: string, maxLines = MAX_LINES) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const resize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return

    el.style.height = 'auto'
    const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight) || 20
    const maxHeight = lineHeight * maxLines
    const minHeight = lineHeight * MIN_LINES
    const nextHeight = Math.min(Math.max(el.scrollHeight, minHeight), maxHeight)

    el.style.height = `${nextHeight}px`
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }, [maxLines])

  useEffect(() => {
    resize()
  }, [value, resize])

  return { textareaRef, resize }
}
