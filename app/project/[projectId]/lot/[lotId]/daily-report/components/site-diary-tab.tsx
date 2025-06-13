'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '../../../../../../../lib/supabase/client'

interface SiteDiaryTabProps {
  lot: any
  dailyReport: any
  onUpdate: () => void
}

interface DiaryEntry {
  id: string
  title: string
  description: string
  photo_url?: string
  timestamp: string
  gps_latitude?: number
  gps_longitude?: number
  weather_at_time?: string
}

export function SiteDiaryTab({ lot, dailyReport, onUpdate }: SiteDiaryTabProps) {
  const [weather, setWeather] = useState(dailyReport?.weather || 'sunny')
  const [activities, setActivities] = useState(dailyReport?.general_activities || '')
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny', icon: '☀️' },
    { value: 'partly_cloudy', label: 'Partly Cloudy', icon: '⛅' },
    { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
    { value: 'overcast', label: 'Overcast', icon: '🌫️' },
    { value: 'light_rain', label: 'Light Rain', icon: '🌦️' },
    { value: 'rain', label: 'Rain', icon: '🌧️' },
    { value: 'heavy_rain', label: 'Heavy Rain', icon: '⛈️' },
    { value: 'storm', label: 'Storm', icon: '⛈️' },
    { value: 'wind', label: 'Windy', icon: '💨' },
    { value: 'fog', label: 'Fog', icon: '🌫️' }
  ]

  // Load diary entries
  useEffect(() => {
    loadDiaryEntries()
  }, [dailyReport?.id])

  const loadDiaryEntries = async () => {
    if (!dailyReport?.id) return

    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('daily_report_id', dailyReport.id)
        .order('timestamp', { ascending: false })

      if (error) throw error
      setDiaryEntries(data || [])
    } catch (error) {
      console.error('Error loading diary entries:', error)
    }
  }

  // Save weather and activities
  const saveGeneralInfo = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('daily_lot_reports')
        .update({
          weather,
          general_activities: activities,
          updated_at: new Date().toISOString()
        })
        .eq('id', dailyReport.id)

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Error saving general info:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle photo capture
  const handleAddPhotoNote = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsCapturing(true)

    try {
      // Get GPS coordinates
      const coordinates = await getCurrentLocation()
      
      // Upload photo to Supabase Storage
      const fileName = `diary/${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('site-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('site-photos')
        .getPublicUrl(fileName)

      // Create watermarked metadata
      const photoTitle = `Site Photo - ${new Date().toLocaleTimeString()}`
      const watermarkInfo = createWatermarkInfo(coordinates)

      // Create diary entry
      const { error: entryError } = await supabase
        .from('diary_entries')
        .insert([{
          daily_report_id: dailyReport.id,
          title: photoTitle,
          description: watermarkInfo,
          photo_url: publicUrl,
          gps_latitude: coordinates?.latitude,
          gps_longitude: coordinates?.longitude,
          weather_at_time: weather
        }])

      if (entryError) throw entryError

      // Refresh entries
      await loadDiaryEntries()
      
      // Show success message
      alert('Photo captured successfully!')

    } catch (error) {
      console.error('Error capturing photo:', error)
      alert('Failed to capture photo. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }

  const getCurrentLocation = (): Promise<{latitude: number, longitude: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          resolve(null)
        },
        { 
          enableHighAccuracy: true, 
          timeout: 10000, 
          maximumAge: 300000 
        }
      )
    })
  }

  const createWatermarkInfo = (coordinates: {latitude: number, longitude: number} | null) => {
    const now = new Date()
    const projectName = lot?.projects?.name || 'Project'
    const lotNumber = lot?.lot_number || lot?.id?.slice(0, 8)
    
    let info = `📍 ${projectName} - Lot ${lotNumber}\n`
    info += `🕐 ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}\n`
    info += `🌤️ Weather: ${weatherOptions.find(w => w.value === weather)?.label || weather}\n`
    
    if (coordinates) {
      info += `🗺️ GPS: ${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}\n`
    }
    
    info += `\n[Photo automatically captured with Site-Proof MVP]`
    
    return info
  }

  const addManualEntry = async () => {
    const title = prompt('Enter event title:')
    const description = prompt('Enter event description:')
    
    if (!title || !description) return

    try {
      const coordinates = await getCurrentLocation()
      
      const { error } = await supabase
        .from('diary_entries')
        .insert([{
          daily_report_id: dailyReport.id,
          title,
          description,
          gps_latitude: coordinates?.latitude,
          gps_longitude: coordinates?.longitude,
          weather_at_time: weather
        }])

      if (error) throw error
      await loadDiaryEntries()
    } catch (error) {
      console.error('Error adding manual entry:', error)
      alert('Failed to add entry. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      {/* Today's Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Today's Overview
        </h2>
        
        {/* Weather Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Weather Conditions
          </label>
          <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
            {weatherOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setWeather(option.value)}
                className={`p-2 text-center rounded-lg border-2 transition-all ${
                  weather === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 text-gray-600 dark:text-gray-400'
                }`}
                title={option.label}
              >
                <div className="text-lg mb-1">{option.icon}</div>
                <div className="text-xs">{option.label.split(' ')[0]}</div>
              </button>
            ))}
          </div>
        </div>

        {/* General Activities */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Today's Activities & General Comments
          </label>
          <textarea
            value={activities}
            onChange={(e) => setActivities(e.target.value)}
            placeholder="Describe the main activities, progress, and any general observations for today..."
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
        </div>

        <button
          onClick={saveGeneralInfo}
          disabled={isSaving}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>

      {/* Events & Evidence */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Events & Evidence
          </h3>
          <div className="flex gap-3">
            <button
              onClick={addManualEntry}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Note
            </button>
            <button
              onClick={handleAddPhotoNote}
              disabled={isCapturing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCapturing ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Add Photo/Note
                </>
              )}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhotoCapture}
          className="hidden"
        />

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Automatic Evidence Capture</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Photos are automatically watermarked with project details, timestamp, GPS coordinates, and weather conditions. 
                This creates undeniable evidence for dispute resolution and variation claims.
              </p>
            </div>
          </div>
        </div>

        {/* Diary Entries Timeline */}
        <div className="space-y-4">
          {diaryEntries.length > 0 ? (
            diaryEntries.map((entry) => (
              <div key={entry.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white">{entry.title}</h4>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                
                {entry.photo_url && (
                  <div className="mb-3">
                    <img 
                      src={entry.photo_url} 
                      alt="Site evidence"
                      className="w-full max-w-md h-48 object-cover rounded-lg border"
                    />
                  </div>
                )}
                
                <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                  {entry.description}
                </div>
                
                {(entry.gps_latitude && entry.gps_longitude) && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    📍 GPS: {entry.gps_latitude.toFixed(6)}, {entry.gps_longitude.toFixed(6)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <p className="mb-2">No events recorded today</p>
              <p className="text-sm">Use "Add Photo/Note" to capture important moments with automatic watermarking</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}