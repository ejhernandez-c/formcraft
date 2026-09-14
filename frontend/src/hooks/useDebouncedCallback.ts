import { useCallback, useEffect, useRef } from 'react'

/** Returns a debounced version of `callback` that only fires `delayMs`
 * after the last call — used for the builder's autosave (see
 * docs/API.md §2: "no separate autosave endpoint, it's the same CRUD
 * surface called opportunistically"). Pending calls are flushed on
 * unmount's cleanup being skipped intentionally: callers that need a
 * guaranteed final save call `flush` explicitly (e.g. on blur). */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
): { debounced: (...args: Args) => void; flush: (...args: Args) => void; cancel: () => void } {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const callbackRef = useRef(callback)

  useEffect(() => {
    callbackRef.current = callback
  })

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const debounced = useCallback(
    (...args: Args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args)
      }, delayMs)
    },
    [delayMs],
  )

  const flush = useCallback((...args: Args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    callbackRef.current(...args)
  }, [])

  // Distinct from flush: drops the pending call instead of executing it —
  // for callers that are about to send their own, more complete save and
  // need to make sure a stale pending one doesn't land afterward and
  // clobber it (e.g. switching a question's control type — see ElementCard.tsx).
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return { debounced, flush, cancel }
}
