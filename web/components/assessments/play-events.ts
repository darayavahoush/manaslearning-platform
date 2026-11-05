'use client'
import {useCallback, useEffect, useRef} from 'react'

/**
 * Browser-only counters for how the session went, kept in memory and sent with the results.
 * - practice repeats: how many times a child pressed "Practice again", per game
 * - pauses: how often the page was hidden (tab switched, app backgrounded, screen locked) and for how long
 * Nothing here is stored; it only travels with the session when the summary is requested.
 */
export function usePlayEvents() {
  const retries = useRef<Record<string, number>>({})
  const pause = useRef<{count: number; ms: number; hiddenAt: number | null}>({count: 0, ms: 0, hiddenAt: null})

  useEffect(() => {
    const onChange = () => {
      const p = pause.current
      if (document.hidden) {
        if (p.hiddenAt === null) { p.hiddenAt = performance.now(); p.count += 1 }
      } else if (p.hiddenAt !== null) {
        p.ms += performance.now() - p.hiddenAt
        p.hiddenAt = null
      }
    }
    document.addEventListener('visibilitychange', onChange)
    return () => document.removeEventListener('visibilitychange', onChange)
  }, [])

  const noteRetry = useCallback((game: string) => {
    retries.current[game] = (retries.current[game] ?? 0) + 1
  }, [])

  const snapshot = useCallback(() => {
    const p = pause.current
    const ms = p.ms + (p.hiddenAt !== null ? performance.now() - p.hiddenAt : 0)
    return {pauseCount: p.count, pausedSec: Math.round(ms / 1000), retries: {...retries.current}}
  }, [])

  return {noteRetry, snapshot}
}
