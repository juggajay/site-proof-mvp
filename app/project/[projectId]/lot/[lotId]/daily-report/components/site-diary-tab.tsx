'use client'

import { useState, useEffect, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { CameraIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline'

interface SiteDiaryTabProps {
  dailyReport: any
  onUpdate: () => void
}

interface DiaryEntry {
  id: string
  daily_report_id: string
  timestamp: string
  title: string
  description: string
  photo_url: string | null
  gps_coordinates: string | null
  created_by: string
  created_at: string
}

export function SiteDiaryTab({ dailyReport, onUpdate }: SiteDiaryTabProps) {
  const [activities, setActivities] = useState(dailyReport?.general_activities || '')
  const [weather, setWeather] = useState(dailyReport?.weather || 'sunny')
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([])
  const [isCapturing, setIsCapturing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newEntryTitle, setNewEntryTitle] = useState('')
  const [newEntryDescription, setNewEntryDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny', icon: '☀️' },
    { value: 'cloudy', label: 'Cloudy', icon: '☁️' },
    { value: 'rain', label: 'Rain', icon: '🌧️' },
    { value: 'storm', label: 'Storm', icon: '⛈️' },
    { value: 'windy', label: 'Windy', icon: '💨' },
    { value: 'fog', label: 'Fog', icon: '🌫️' }
  ]

  useEffect(() => {
    if (dailyReport?.id) {
      loadDiaryEntries()
    }
  }, [dailyReport])

  const loadDiaryEntries = async () => {
    try {
      console.log('📖 Loading diary entries for report:', dailyReport.id)
      
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('daily_report_id', dailyReport.id)
        .order('timestamp', { ascending: false })

      if (error) {
        console.error('Error loading diary entries:', error)
        return
      }

      console.log('✅ Loaded', data?.length || 0, 'diary entries')
      setDiaryEntries(data || [])
    } catch (error) {
      console.error('Error loading diary entries:', error)
    }
  }

  const saveGeneralInfo = async () => {
    if (!dailyReport?.id) return
    
    setIsSaving(true)
    try {
      console.log('💾 Saving general info...')
      
      const { error } = await supabase
        .from('daily_lot_reports')
        .update({
          general_activities: activities,
          weather: weather,
          updated_at: new Date().toISOString()
        })
        .eq('id', dailyReport.id)
      
      if (error) {
        console.error('Error saving general info:', error)
        throw error
      }

      console.log('✅ General info saved')
      onUpdate()
    } catch (error) {
      console.error('Error saving general info:', error)
      alert('Failed to save changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddPhotoNote = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsCapturing(true)
    
    try {
      console.log('📸 Processing photo capture...')
      
      // Get GPS coordinates
      const coords = await getCurrentLocation()
      console.log('📍 GPS coordinates:', coords)
      
      // Upload photo to Supabase Storage
      const fileName = `diary-${Date.now()}-${file.name}`
      console.log('⬆️ Uploading photo:', fileName)
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('diary-photos')
        .upload(fileName, file)

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('diary-photos')
        .getPublicUrl(fileName)

      console.log('🔗 Photo URL:', publicUrl)

      // Create diary entry
      const { error: entryError } = await supabase
        .from('diary_entries')
        .insert([{
          daily_report_id: dailyReport.id,
          title: newEntryTitle || 'Photo Evidence',
          description: newEntryDescription || 'Photo captured on site',
          photo_url: publicUrl,
          gps_coordinates: coords ? `POINT(${coords.longitude} ${coords.latitude})` : null
        }])

      if (entryError) {
        console.error('Entry creation error:', entryError)
        throw entryError
      }

      console.log('✅ Diary entry created successfully')
      
      // Reset form and reload entries
      setNewEntryTitle('')
      setNewEntryDescription('')
      loadDiaryEntries()
      
    } catch (error) {
      console.error('Error capturing photo:', error)
      alert('Failed to capture photo. Please try again.')
    } finally {
      setIsCapturing(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const addTextEntry = async () => {
    if (!newEntryTitle.trim()) {
      alert('Please enter a title for the entry')
      return
    }

    setIsCapturing(true)
    try {
      console.log('📝 Adding text entry...')
      
      const coords = await getCurrentLocation()
      
      const { error } = await supabase
        .from('diary_entries')
        .insert([{
          daily_report_id: dailyReport.id,
          title: newEntryTitle,
          description: newEntryDescription,
          photo_url: null,
          gps_coordinates: coords ? `POINT(${coords.longitude} ${coords.latitude})` : null
        }])

      if (error) throw error

      console.log('✅ Text entry created')
      setNewEntryTitle('')
      setNewEntryDescription('')
      loadDiaryEntries()
      
    } catch (error) {
      console.error('Error adding text entry:', error)
      alert('Failed to add entry. Please try again.')
    } finally {
      setIsCapturing(false)
    }
  }

  const getCurrentLocation = (): Promise<{latitude: number, longitude: number} | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.log('❌ Geolocation not supported')
        resolve(null)
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          }
          console.log('✅ GPS coordinates obtained:', coords)
          resolve(coords)
        },
        (error) => {
          console.error('GPS error:', error)
          resolve(null)
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
      )
    })
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-AU', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const parseGPSCoordinates = (gpsString: string | null) => {
    if (!gpsString) return null
    
    // Parse POINT(longitude latitude) format
    const match = gpsString.match(/POINT\(([^)]+)\)/)
    if (!match) return null
    
    const [longitude, latitude] = match[1].split(' ').map(Number)
    return { latitude, longitude }
  }

  return (
    <div className="space-y-6">
      {/* Weather and General Activities */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Today's Overview
        </h2>
        
        {/* Weather Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Weather Conditions
          </label>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            {weatherOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setWeather(option.value)}
                className={`p-3 text-center rounded-lg border-2 transition-all ${
                  weather === option.value
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1">{option.icon}</div>
                <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {option.label}
                </div>
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
            onBlur={saveGeneralInfo}
            placeholder="Describe the main activities, progress, and any general observations for today..."
            className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Changes are saved automatically when you click outside the text area
            </p>
            {isSaving && (
              <div className="flex items-center text-xs text-blue-600 dark:text-blue-400">
                <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add New Entry */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add New Entry
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entry Title
            </label>
            <input
              type="text"
              value={newEntryTitle}
              onChange={(e) => setNewEntryTitle(e.target.value)}
              placeholder="e.g., Concrete pour completed, Issue with drainage, Progress update"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={newEntryDescription}
              onChange={(e) => setNewEntryDescription(e.target.value)}
              placeholder="Additional details about this entry..."
              className="w-full h-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={addTextEntry}
              disabled={isCapturing || !newEntryTitle.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              📝 Add Text Entry
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
                  <CameraIcon className="w-4 h-4" />
                  Add Photo
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

        <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
          💡 <strong>Pro tip:</strong> Photos are automatically tagged with GPS coordinates and timestamps. 
          Perfect for documenting progress, issues, or compliance evidence.
        </p>
      </div>

      {/* Diary Entries List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Today's Events ({diaryEntries.length})
          </h3>
          {diaryEntries.length > 0 && (
            <button
              onClick={loadDiaryEntries}
              className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              🔄 Refresh
            </button>
          )}
        </div>

        <div className="space-y-4">
          {diaryEntries.map((entry) => {
            const coords = parseGPSCoordinates(entry.gps_coordinates)
            
            return (
              <div key={entry.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900 dark:text-white text-lg">
                    {entry.title}
                  </h4>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    {formatTimestamp(entry.timestamp)}
                  </div>
                </div>
                
                {entry.photo_url && (
                  <div className="mb-3">
                    <img 
                      src={entry.photo_url} 
                      alt="Site photo"
                      className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-200 dark:border-gray-600"
                    />
                  </div>
                )}
                
                {entry.description && (
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {entry.description}
                  </p>
                )}
                
                {coords && (
                  <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <MapPinIcon className="w-3 h-3 mr-1" />
                    GPS: {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                  </div>
                )}
              </div>
            )
          })}
          
          {diaryEntries.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-4">📝</div>
              <h4 className="text-lg font-medium mb-2">No events recorded today</h4>
              <p className="text-sm">
                Start documenting your day by adding text entries or capturing photos above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}