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
): { debounced: (...args: Args) => void; flush: (...args: Args) => void } {
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

  return { debounced, flush }
}
