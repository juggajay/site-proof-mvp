"use client"

import { useState, useCallback } from "react"
import { useToast } from "./use-toast"
import { ERROR_MESSAGES } from "@/lib/constants"

interface UseAsyncOperationOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  successMessage?: string
  errorMessage?: string
}

export function useAsyncOperation<T = any>(
  operation: (...args: any[]) => Promise<T>,
  options: UseAsyncOperationOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)
  const { toast } = useToast()

  const execute = useCallback(
    async (...args: any[]) => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await operation(...args)
        setData(result)
        
        if (options.onSuccess) {
          options.onSuccess(result)
        }
        
        if (options.successMessage) {
          toast({
            title: "Success",
            description: options.successMessage,
            variant: "success",
          })
        }
        
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(ERROR_MESSAGES.GENERIC)
        setError(error)
        
        if (options.onError) {
          options.onError(error)
        }
        
        const errorMessage = options.errorMessage || error.message || ERROR_MESSAGES.GENERIC
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
        
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [operation, options, toast]
  )

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    execute,
    isLoading,
    error,
    data,
    reset,
  }
}