import { useEffect, useState, useCallback, useRef } from 'react'

export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): [T, boolean] {
  const [isPending, setIsPending] = useState(false)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  const debouncedCallback = useCallback((...args: Parameters<T>) => {
    // Clear any existing timeout
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
    }
    
    // Set pending state immediately
    setIsPending(true)
    
    // Set up new timeout
    timeoutIdRef.current = setTimeout(async () => {
      try {
        await callback(...args)
      } finally {
        setIsPending(false)
      }
    }, delay)
  }, [callback, delay]) as T

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
      }
    }
  }, [])

  return [debouncedCallback, isPending]
}