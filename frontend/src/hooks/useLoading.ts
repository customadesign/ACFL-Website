import { useState, useCallback } from 'react'

export interface LoadingState {
  isLoading: boolean
  error: string | null
  startLoading: () => void
  stopLoading: () => void
  setError: (error: string | null) => void
  reset: () => void
}

/**
 * Custom hook for managing loading states
 * @param initialLoading - Initial loading state (default: false)
 * @returns Loading state and control functions
 */
export function useLoading(initialLoading = false): LoadingState {
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState<string | null>(null)

  const startLoading = useCallback(() => {
    setIsLoading(true)
    setError(null)
  }, [])

  const stopLoading = useCallback(() => {
    setIsLoading(false)
  }, [])

  const setErrorState = useCallback((error: string | null) => {
    setError(error)
    if (error) {
      setIsLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setError: setErrorState,
    reset,
  }
}

/**
 * Hook for async operations with loading state
 * @param asyncFn - Async function to execute
 * @returns Loading state and execute function
 */
export function useAsyncLoading<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>
) {
  const { isLoading, error, startLoading, stopLoading, setError, reset } = useLoading()

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      startLoading()
      const result = await asyncFn(...args)
      stopLoading()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      return null
    }
  }, [asyncFn, startLoading, stopLoading, setError])

  return {
    isLoading,
    error,
    execute,
    reset,
  }
}

/**
 * Hook for managing multiple loading states
 * @param keys - Array of loading state keys
 * @returns Object with loading states and control functions
 */
export function useMultipleLoading<T extends string>(keys: T[]) {
  const [loadingStates, setLoadingStates] = useState<Record<T, boolean>>(
    keys.reduce((acc, key) => ({ ...acc, [key]: false }), {} as Record<T, boolean>)
  )

  const setLoading = useCallback((key: T, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }, [])

  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  return {
    loadingStates,
    setLoading,
    isAnyLoading,
  }
}

/**
 * Hook for debounced loading states (useful for search/input)
 * @param delay - Delay in milliseconds (default: 300)
 * @returns Loading state and debounced execute function
 */
export function useDebouncedLoading(delay = 300) {
  const { isLoading, startLoading, stopLoading, error, setError } = useLoading()
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  const debouncedExecute = useCallback(async (asyncFn: () => Promise<any>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    const newTimeoutId = setTimeout(async () => {
      try {
        startLoading()
        await asyncFn()
        stopLoading()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      }
    }, delay)

    setTimeoutId(newTimeoutId)
  }, [delay, startLoading, stopLoading, setError, timeoutId])

  return {
    isLoading,
    error,
    debouncedExecute,
  }
}