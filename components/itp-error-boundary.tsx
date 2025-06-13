'use client'

import { useEffect } from 'react'

export function ITPageErrorSuppressor() {
  useEffect(() => {
    // Suppress specific ITP-related console errors
    const originalError = console.error
    console.error = (...args) => {
      const message = args.join(' ')
      
      // Skip these specific errors
      if (
        message.includes('Failed to parse cookie string') ||
        message.includes('Multiple GoTrueClient instances') ||
        message.includes('Error loading ITP data') ||
        message.includes('base64-ey')
      ) {
        return // Don't log these errors
      }
      
      // Log other errors normally
      originalError.apply(console, args)
    }

    return () => {
      console.error = originalError
    }
  }, [])

  return null
}