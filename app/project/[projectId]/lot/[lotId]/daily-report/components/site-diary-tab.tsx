'use client'

import { useState, useEffect, useRef, useCallback, useTransition } from 'react'
import Image from 'next/image'
import { createClient } from '../../../../../../../lib/supabase/client'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../../../../components/ui/select'
import { Cloud, Calendar, ChevronLeft, ChevronRight, History, Zap, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { saveSiteDiaryAction } from '../../../../../../../actions'
import { SmartEventModal } from '../../../../../../../components/modals/smart-event-modal'

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
  const [isPending, startTransition] = useTransition()
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]!)
  const [historicalData, setHistoricalData] = useState<any>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [showSmartEventModal, setShowSmartEventModal] = useState(false)
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

  const loadDiaryEntries = useCallback(async () => {
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
  }, [dailyReport?.id, supabase])

  // Load available dates with diary entries
  const loadAvailableDates = useCallback(async () => {
    if (!lot?.id) return

    try {
      const { data, error } = await supabase
        .from('daily_lot_reports')
        .select('report_date')
        .eq('lot_id', lot.id)
        .order('report_date', { ascending: false })

      if (error) throw error
      
      const dates = data?.map(item => item.report_date) || []
      setAvailableDates(dates)
    } catch (error) {
      console.error('Error loading available dates:', error)
    }
  }, [lot?.id, supabase])

  // Load historical data for selected date
  const loadHistoricalData = useCallback(async (date: string) => {
    if (!lot?.id) return

    try {
      const { data, error } = await supabase
        .from('daily_lot_reports')
        .select('*')
        .eq('lot_id', lot.id)
        .eq('report_date', date)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      setHistoricalData(data || null)
      
      // Update form fields when viewing historical data
      if (data) {
        setWeather(data.weather || 'sunny')
        setActivities(data.general_comments || '')
      } else {
        // Reset to today's data if no historical data found
        setWeather(dailyReport?.weather || 'sunny')
        setActivities(dailyReport?.general_comments || '')
      }
    } catch (error) {
      console.error('Error loading historical data:', error)
      toast.error('Failed to load historical data')
    }
  }, [lot?.id, supabase, dailyReport])

  // Load diary entries
  useEffect(() => {
    loadDiaryEntries()
    loadAvailableDates()
  }, [loadDiaryEntries, loadAvailableDates])

  // Load historical data when date changes
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    if (selectedDate && selectedDate !== today) {
      loadHistoricalData(selectedDate)
    } else {
      // Reset to today's data
      setHistoricalData(null)
      setWeather(dailyReport?.weather || 'sunny')
      setActivities(dailyReport?.general_comments || '')
    }
  }, [selectedDate, loadHistoricalData, dailyReport])

  // Save weather and activities using server action
  const handleSave = () => {
    console.log('=== SAVE BUTTON CLICKED ===')
    console.log('Weather:', weather)
    console.log('Activities (general comments):', activities)
    
    if (!activities.trim()) {
      console.log('No comments - showing error')
      toast.error('Please add some general comments')
      return
    }

    if (!weather) {
      console.log('No weather - showing error')
      toast.error('Please select weather conditions')
      return
    }

    console.log('Starting save process...')
    
    startTransition(async () => {
      try {
        console.log('Creating FormData...')
        const formData = new FormData()
        formData.append('lotId', lot.id)
        const reportDate = new Date().toISOString().split('T')[0]!
        formData.append('reportDate', reportDate)
        formData.append('generalComments', activities)
        formData.append('weather', weather)
        
        console.log('FormData contents:')
        console.log('- lotId:', lot.id)
        console.log('- reportDate:', new Date().toISOString().split('T')[0])
        console.log('- generalComments:', activities)
        console.log('- weather:', weather)
        
        console.log('Calling saveSiteDiaryAction...')
        const result = await saveSiteDiaryAction(formData)
        console.log('Save result:', result)
        toast.success(result.message)
        onUpdate()
      } catch (error) {
        console.error('=== SAVE ERROR ===')
        console.error('Error type:', typeof error)
        console.error('Error message:', error instanceof Error ? error.message : String(error))
        console.error('Full error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to save')
      }
    })
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
      {/* Date Selection and History Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Site Diary
            </h2>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                showHistory
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <History className="h-4 w-4" />
              {showHistory ? 'Hide History' : 'View History'}
            </button>
          </div>
          
          {showHistory && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Date:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}
        </div>

        {showHistory && availableDates.length > 0 && (
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Available diary entries: {availableDates.length} days
            </p>
            <div className="flex flex-wrap gap-2">
              {availableDates.slice(0, 10).map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    selectedDate === date
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {new Date(date).toLocaleDateString()}
                </button>
              ))}
              {availableDates.length > 10 && (
                <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">
                  +{availableDates.length - 10} more...
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Site Diary Entry Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {selectedDate === new Date().toISOString().split('T')[0]
              ? "Today's Overview"
              : `Site Diary - ${selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Unknown Date'}`}
          </h3>
          
          {historicalData && selectedDate !== new Date().toISOString().split('T')[0] && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <History className="h-4 w-4" />
              Viewing historical data
            </div>
          )}
          
          {!historicalData && selectedDate !== new Date().toISOString().split('T')[0] && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              No data for this date
            </div>
          )}
        </div>
        
        {/* Weather Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            Weather Conditions
          </label>
          <Select value={weather} onValueChange={setWeather}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select weather conditions" />
            </SelectTrigger>
            <SelectContent>
              {weatherOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        <div className="flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={isPending || selectedDate !== new Date().toISOString().split('T')[0]}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isPending ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              'Save Diary'
            )}
          </button>
          
          {selectedDate !== new Date().toISOString().split('T')[0] && (
            <div className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Historical data is read-only
            </div>
          )}
        </div>
      </div>

      {/* Events & Evidence */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Events & Evidence
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => setShowSmartEventModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg"
            >
              <Zap className="w-4 h-4" />
              Smart Event
            </button>
            <button
              onClick={addManualEntry}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              <Plus className="w-4 h-4" />
              Quick Note
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

        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">Smart Evidence Engine</h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Intelligent event categorization (DELAY, INSTRUCTION, SAFETY, QUALITY) with automatic evidence linking.
                Creates undeniable narrative chains for dispute resolution with GPS, timestamps, and weather data.
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
                    <Image
                      src={entry.photo_url}
                      alt="Site evidence"
                      width={384}
                      height={192}
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

      {/* Smart Event Modal */}
      <SmartEventModal
        open={showSmartEventModal}
        onOpenChange={setShowSmartEventModal}
        lotData={lot}
        onEventSaved={loadDiaryEntries}
      />
    </div>
  )
}