import { CheckCircle, XCircle } from 'lucide-react'
import { format } from 'date-fns'
import { useIsMobile } from '@/hooks/useMediaQuery'

interface AutoSaveStatusProps {
  isSaving: boolean
  lastSaved: Date | null
  error?: string | null
}

export function AutoSaveStatus({ isSaving, lastSaved, error }: AutoSaveStatusProps) {
  const isMobile = useIsMobile()

  if (error) {
    return (
      <div className={`flex items-center text-sm text-red-600 ${isMobile ? 'fixed bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg z-50' : ''}`}>
        <XCircle className="h-4 w-4 mr-2" />
        {isMobile ? 'Error' : 'Save failed. Retrying...'}
      </div>
    )
  }

  if (isSaving) {
    return (
      <div className={`flex items-center text-sm text-gray-500 ${isMobile ? 'fixed bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg z-50' : ''}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2" />
        {isMobile ? '' : 'Saving...'}
      </div>
    )
  }

  if (lastSaved && !isMobile) {
    return (
      <div className="flex items-center text-sm text-green-600">
        <CheckCircle className="h-4 w-4 mr-2" />
        All changes saved {format(lastSaved, 'h:mm a')}
      </div>
    )
  }

  return null
}