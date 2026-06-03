'use client'

import { useCallback, useRef } from 'react'

const BOTTOM_THRESHOLD_PX = 80

export function useStickToBottom() {
  const stickToBottomRef = useRef(true)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    const el = elementRef.current
    if (!el || !stickToBottomRef.current) return
    el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const onScroll = useCallback(() => {
    const el = elementRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom <= BOTTOM_THRESHOLD_PX
  }, [])

  const containerRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (elementRef.current) {
        elementRef.current.removeEventListener('scroll', onScroll)
      }

      elementRef.current = node

      if (node) {
        node.addEventListener('scroll', onScroll, { passive: true })
      }
    },
    [onScroll]
  )

  return { containerRef, scrollToBottom, stickToBottomRef }
}
