'use client'

import { useState, useRef, useCallback } from 'react'
import { Camera, Upload, X, FileText, MapPin } from 'lucide-react'
import { ITPInspectionAttachment, UploadAttachmentRequest } from '@/types/new-itp'

interface MobilePhotoCaptureProps {
  inspectionRecordId: string
  onPhotosCaptured: (attachments: ITPInspectionAttachment[]) => void
  maxPhotos?: number
  allowDocuments?: boolean
}

export function MobilePhotoCapture({ 
  inspectionRecordId, 
  onPhotosCaptured,
  maxPhotos = 5,
  allowDocuments = true
}: MobilePhotoCaptureProps) {
  const [photos, setPhotos] = useState<UploadAttachmentRequest[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Get current location
  const getCurrentLocation = async () => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position),
        error => reject(error),
        { 
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      )
    })
  }

  // Handle camera capture (mobile)
  const handleCameraCapture = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsCapturing(true)
    setIsGettingLocation(true)

    let location: UploadAttachmentRequest['location'] | undefined

    try {
      // Try to get location (don't fail if it doesn't work)
      const position = await getCurrentLocation()
      location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        altitude: position.coords.altitude || undefined,
        accuracy: position.coords.accuracy
      }
    } catch (error) {
      console.log('Location not available:', error)
    } finally {
      setIsGettingLocation(false)
    }

    const newPhotos: UploadAttachmentRequest[] = []

    for (let i = 0; i < files.length && photos.length + newPhotos.length < maxPhotos; i++) {
      const file = files[i]
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        continue
      }

      const attachmentType = file.type.startsWith('video/') ? 'video' : 'photo'

      newPhotos.push({
        file,
        attachment_type: attachmentType,
        location
      })
    }

    setPhotos(prev => [...prev, ...newPhotos])
    setIsCapturing(false)

    // Clear input
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }, [photos.length, maxPhotos])

  // Handle document upload
  const handleDocumentUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newDocs: UploadAttachmentRequest[] = []

    for (let i = 0; i < files.length && photos.length + newDocs.length < maxPhotos; i++) {
      const file = files[i]
      
      newDocs.push({
        file,
        attachment_type: 'document'
      })
    }

    setPhotos(prev => [...prev, ...newDocs])

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [photos.length, maxPhotos])

  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  // Add description to photo
  const updateDescription = (index: number, description: string) => {
    setPhotos(prev => prev.map((photo, i) => 
      i === index ? { ...photo, description } : photo
    ))
  }

  // Get file preview URL
  const getPreviewUrl = (file: File) => {
    return URL.createObjectURL(file)
  }

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-4">
      {/* Capture buttons */}
      <div className="flex gap-3">
        {/* Camera capture (primary for mobile) */}
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={photos.length >= maxPhotos}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg
            ${photos.length >= maxPhotos
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
            }
            transition-colors font-medium
          `}
        >
          <Camera className="h-5 w-5" />
          Take Photo
        </button>

        {/* Document upload (if allowed) */}
        {allowDocuments && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={photos.length >= maxPhotos}
            className={`
              flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2
              ${photos.length >= maxPhotos
                ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100'
              }
              transition-colors font-medium
            `}
          >
            <Upload className="h-5 w-5" />
            Upload
          </button>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*,video/*"
        capture="environment"
        multiple
        onChange={handleCameraCapture}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,.pdf,.doc,.docx"
        multiple
        onChange={handleDocumentUpload}
        className="hidden"
      />

      {/* Status messages */}
      {isCapturing && (
        <div className="text-sm text-blue-600 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
          Processing photo...
        </div>
      )}
      {isGettingLocation && (
        <div className="text-sm text-gray-500 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Getting location...
        </div>
      )}

      {/* Photo preview grid */}
      {photos.length > 0 && (
        <div className="space-y-3">
          {photos.map((photo, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex gap-3">
                {/* Thumbnail */}
                {photo.attachment_type === 'photo' || photo.attachment_type === 'video' ? (
                  <div className="w-20 h-20 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                    <img
                      src={getPreviewUrl(photo.file)}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {photo.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(photo.file.size)}
                      </p>
                      {photo.location && (
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          Location captured
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removePhoto(index)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Description input */}
                  <input
                    type="text"
                    placeholder="Add description..."
                    value={photo.description || ''}
                    onChange={(e) => updateDescription(index, e.target.value)}
                    className="mt-2 w-full px-2 py-1 text-sm border border-gray-200 rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload count */}
      <div className="text-sm text-gray-500 text-center">
        {photos.length} of {maxPhotos} attachments
      </div>
    </div>
  )
}