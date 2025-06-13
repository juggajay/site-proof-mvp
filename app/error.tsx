'use client'

import { useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('Application Error:', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl">Something went wrong!</CardTitle>
          <CardDescription>
            An error occurred while loading this page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground bg-muted p-3 rounded">
            <strong>Error:</strong> {error.message}
            {error.digest && (
              <div className="mt-2">
                <strong>Error ID:</strong> {error.digest}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={() => reset()} className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex-1"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}