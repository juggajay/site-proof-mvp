'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus, Users, Truck, Package, AlertTriangle, Camera, Mic, MicOff, Save, Calendar, Thermometer, Shield } from 'lucide-react'
import { Button } from '../ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { toast } from 'sonner'
import { siteDiaryService } from '../../lib/services/site-diary-service'
import type {
  CompleteSiteDiary,
  ManpowerEntryForm,
  EquipmentEntryForm,
  DeliveryEntryForm,
  EventEntryForm,
  EventCategory,
  ImpactLevel
} from '../../types/phase1-site-diary'

// Constants for dropdowns
const COMMON_TRADES = [
  'General Labourer',
  'Plant Operator',
  'Truck Driver',
  'Concrete Finisher',
  'Steel Fixer',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Supervisor',
  'Foreman',
  'Safety Officer'
] as const

const COMMON_EQUIPMENT = [
  'Excavator',
  'Crane',
  'Concrete Pump',
  'Bulldozer',
  'Loader',
  'Dump Truck',
  'Compactor',
  'Generator',
  'Welding Equipment',
  'Scaffolding'
] as const

const WEATHER_CONDITIONS = [
  'sunny',
  'partly_cloudy',
  'cloudy',
  'overcast',
  'light_rain',
  'rain',
  'heavy_rain',
  'storm',
  'wind',
  'fog'
] as const

const EVENT_CATEGORIES: EventCategory[] = [
  'DELAY',
  'INSTRUCTION',
  'SAFETY',
  'WEATHER',
  'INSPECTION',
  'QUALITY_ISSUE',
  'VISITOR',
  'MEETING',
  'OTHER'
]

const IMPACT_LEVELS: ImpactLevel[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

interface ComprehensiveSiteDiaryProps {
  projectId: string
  projectName: string
  lotNumber?: string
  date?: string
  onUpdate?: () => void
}

// Voice Recognition Hook
function useVoiceRecognition() {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        setIsSupported(true)
        recognitionRef.current = new SpeechRecognition()
        
        if (recognitionRef.current) {
          recognitionRef.current.continuous = false
          recognitionRef.current.interimResults = false
          recognitionRef.current.lang = 'en-AU'
        }
      }
    }
  }, [])

  const startListening = useCallback((onResult: (transcript: string) => void) => {
    if (!recognitionRef.current || !isSupported) return

    setIsListening(true)
    
    recognitionRef.current.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onResult(transcript)
      setIsListening(false)
    }

    recognitionRef.current.onerror = () => {
      setIsListening(false)
      toast.error('Voice recognition error. Please try again.')
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }, [isSupported])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  return { isListening, isSupported, startListening, stopListening }
}

// Voice Input Component
function VoiceInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { isListening, isSupported, startListening, stopListening } = useVoiceRecognition()

  const handleVoiceInput = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening((transcript) => {
        onChange(value + (value ? ' ' : '') + transcript)
      })
    }
  }

  if (!isSupported) return null

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleVoiceInput}
      className={`ml-2 ${isListening ? 'bg-red-100 text-red-700 border-red-300' : ''}`}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  )
}

export function ComprehensiveSiteDiary({ 
  projectId, 
  projectName, 
  lotNumber, 
  date = new Date().toISOString().split('T')[0]!,
  onUpdate 
}: ComprehensiveSiteDiaryProps) {
  const [siteDiary, setSiteDiary] = useState<CompleteSiteDiary | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState<'overview' | 'manpower' | 'equipment' | 'deliveries' | 'events'>('overview')

  // Form states
  const [generalNotes, setGeneralNotes] = useState('')
  const [weatherConditions, setWeatherConditions] = useState('')
  const [temperature, setTemperature] = useState('')
  const [siteSupervisor, setSiteSupervisor] = useState('')
  const [safetyBriefing, setSafetyBriefing] = useState(false)

  // Entry form states
  const [manpowerForm, setManpowerForm] = useState<ManpowerEntryForm>({
    trade: '',
    workers_count: 1,
    hours_worked: 8,
    supervisor: '',
    notes: '',
    weather_impact: false,
    overtime_hours: 0
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load site diary data
  const loadSiteDiary = useCallback(async () => {
    try {
      setLoading(true)
      const diary = await siteDiaryService.getCompleteDiary(projectId, date)
      setSiteDiary(diary)
      
      if (diary?.diary_entry) {
        setGeneralNotes(diary.diary_entry.general_notes || '')
        setWeatherConditions(diary.diary_entry.weather_conditions || '')
        setTemperature(diary.diary_entry.temperature_celsius?.toString() || '')
        setSiteSupervisor(diary.diary_entry.site_supervisor || '')
        setSafetyBriefing(diary.diary_entry.safety_briefing_conducted)
      }
    } catch (error) {
      console.error('Error loading site diary:', error)
      toast.error('Failed to load site diary')
    } finally {
      setLoading(false)
    }
  }, [projectId, date])

  useEffect(() => {
    loadSiteDiary()
  }, [loadSiteDiary])

  // Save diary overview
  const saveDiaryOverview = async () => {
    if (!siteDiary?.diary_entry) return

    try {
      setSaving(true)
      await siteDiaryService.updateDiaryEntry(siteDiary.diary_entry.id, {
        general_notes: generalNotes,
        weather_conditions: weatherConditions,
        temperature_celsius: temperature ? parseInt(temperature) : undefined,
        site_supervisor: siteSupervisor,
        safety_briefing_conducted: safetyBriefing
      })
      
      toast.success('Site diary updated successfully')
      onUpdate?.()
    } catch (error) {
      console.error('Error saving diary:', error)
      toast.error('Failed to save site diary')
    } finally {
      setSaving(false)
    }
  }

  // Add manpower entry
  const addManpowerEntry = async () => {
    if (!siteDiary?.diary_entry || !manpowerForm.trade || manpowerForm.workers_count <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await siteDiaryService.addManpowerEntry(siteDiary.diary_entry.id, manpowerForm)
      setManpowerForm({
        trade: '',
        workers_count: 1,
        hours_worked: 8,
        supervisor: '',
        notes: '',
        weather_impact: false,
        overtime_hours: 0
      })
      await loadSiteDiary()
      toast.success('Manpower entry added')
    } catch (error) {
      console.error('Error adding manpower entry:', error)
      toast.error('Failed to add manpower entry')
    }
  }

  // Handle photo capture
  const handlePhotoCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !siteDiary?.diary_entry) return

    try {
      const coordinates = await siteDiaryService.getCurrentLocation()
      const watermarkData = siteDiaryService.createWatermarkData(
        projectName,
        lotNumber,
        weatherConditions,
        'Site User',
        coordinates || undefined
      )

      await siteDiaryService.uploadWatermarkedPhoto(
        file,
        watermarkData,
        'diary',
        siteDiary.diary_entry.id
      )

      await loadSiteDiary()
      toast.success('Photo uploaded with watermark')
    } catch (error) {
      console.error('Error uploading photo:', error)
      toast.error('Failed to upload photo')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72]"></div>
      </div>
    )
  }

  const sections = [
    { id: 'overview', label: 'Overview', icon: Calendar, color: 'bg-[#1B4F72]' },
    { id: 'manpower', label: 'Manpower', icon: Users, color: 'bg-[#F1C40F]' },
    { id: 'equipment', label: 'Equipment', icon: Truck, color: 'bg-[#1B4F72]' },
    { id: 'deliveries', label: 'Deliveries', icon: Package, color: 'bg-[#F1C40F]' },
    { id: 'events', label: 'Events', icon: AlertTriangle, color: 'bg-[#1B4F72]' }
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold">Site Diary - {new Date(date).toLocaleDateString()}</h1>
            <p className="text-white/90 font-primary">{projectName} {lotNumber && `• Lot ${lotNumber}`}</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Camera className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoCapture}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="flex flex-wrap gap-2">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id
          return (
            <Button
              key={section.id}
              onClick={() => setActiveSection(section.id as any)}
              variant={isActive ? "default" : "outline"}
              className={`${isActive ? `${section.color} text-white` : 'border-slate-300'} font-primary`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {section.label}
              {section.id === 'manpower' && siteDiary && (
                <Badge className="ml-2 bg-white/20 text-white border-0">
                  {siteDiary.manpower_entries.length}
                </Badge>
              )}
            </Button>
          )
        })}
      </div>

      {/* Overview Section */}
      {activeSection === 'overview' && (
        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
            <CardTitle className="flex items-center gap-2 text-slate-900 font-heading">
              <Calendar className="h-5 w-5" />
              Daily Overview
            </CardTitle>
            <CardDescription className="font-primary">General site conditions and activities</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Weather and Conditions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="font-primary">Weather Conditions</Label>
                <Select value={weatherConditions} onValueChange={setWeatherConditions}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather" />
                  </SelectTrigger>
                  <SelectContent>
                    {WEATHER_CONDITIONS.map((weather) => (
                      <SelectItem key={weather} value={weather}>
                        {weather.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="font-primary">Temperature (°C)</Label>
                <div className="flex">
                  <Input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    placeholder="25"
                  />
                  <Thermometer className="h-4 w-4 ml-2 mt-3 text-slate-500" />
                </div>
              </div>

              <div>
                <Label className="font-primary">Site Supervisor</Label>
                <div className="flex">
                  <Input
                    value={siteSupervisor}
                    onChange={(e) => setSiteSupervisor(e.target.value)}
                    placeholder="Supervisor name"
                  />
                  <VoiceInput
                    value={siteSupervisor}
                    onChange={setSiteSupervisor}
                  />
                </div>
              </div>
            </div>

            {/* Safety Briefing */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="safety-briefing"
                checked={safetyBriefing}
                onChange={(e) => setSafetyBriefing(e.target.checked)}
                className="rounded border-slate-300"
              />
              <Label htmlFor="safety-briefing" className="flex items-center gap-2 font-primary">
                <Shield className="h-4 w-4 text-[#1B4F72]" />
                Safety briefing conducted
              </Label>
            </div>

            {/* General Notes */}
            <div>
              <Label className="font-primary">General Notes & Activities</Label>
              <div className="flex">
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder="Describe today's main activities, progress, and any general observations..."
                  className="min-h-[120px]"
                />
                <VoiceInput
                  value={generalNotes}
                  onChange={setGeneralNotes}
                />
              </div>
            </div>

            <Button onClick={saveDiaryOverview} disabled={saving} className="site-proof-btn-primary">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Overview'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Manpower Section */}
      {activeSection === 'manpower' && (
        <div className="space-y-6">
          {/* Add Manpower Form */}
          <Card className="border-slate-200">
            <CardHeader className="bg-gradient-to-r from-[#F1C40F] to-[#F39C12]">
              <CardTitle className="flex items-center gap-2 text-slate-900 font-heading">
                <Users className="h-5 w-5" />
                Add Manpower Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-primary">Trade *</Label>
                  <Select value={manpowerForm.trade} onValueChange={(value) => setManpowerForm({...manpowerForm, trade: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select trade" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TRADES.map((trade) => (
                        <SelectItem key={trade} value={trade}>{trade}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-primary">Workers Count *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={manpowerForm.workers_count}
                    onChange={(e) => setManpowerForm({...manpowerForm, workers_count: parseInt(e.target.value) || 1})}
                  />
                </div>

                <div>
                  <Label className="font-primary">Hours Worked *</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={manpowerForm.hours_worked}
                    onChange={(e) => setManpowerForm({...manpowerForm, hours_worked: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <Button onClick={addManpowerEntry} className="site-proof-btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Manpower Entry
              </Button>
            </CardContent>
          </Card>

          {/* Manpower Entries List */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="font-heading">Today's Manpower ({siteDiary?.manpower_entries.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {siteDiary?.manpower_entries.length ? (
                <div className="space-y-3">
                  {siteDiary.manpower_entries.map((entry) => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 font-heading">{entry.trade}</h4>
                          <p className="text-sm text-slate-600 font-primary">
                            {entry.workers_count} workers • {entry.hours_worked}h
                            {entry.overtime_hours > 0 && ` (${entry.overtime_hours}h overtime)`}
                          </p>
                          {entry.supervisor && (
                            <p className="text-sm text-slate-600 font-primary">Supervisor: {entry.supervisor}</p>
                          )}
                          {entry.notes && (
                            <p className="text-sm text-slate-500 mt-1 font-primary">{entry.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {entry.weather_impact && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">Weather Impact</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8 font-primary">No manpower entries for today</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Placeholder sections for other tabs */}
      {activeSection === 'equipment' && (
        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] text-white">
            <CardTitle className="flex items-center gap-2 font-heading">
              <Truck className="h-5 w-5" />
              Equipment Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-slate-500 py-8 font-primary">Equipment tracking coming soon...</p>
          </CardContent>
        </Card>
      )}

      {activeSection === 'deliveries' && (
        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-[#F1C40F] to-[#F39C12]">
            <CardTitle className="flex items-center gap-2 text-slate-900 font-heading">
              <Package className="h-5 w-5" />
              Delivery Tracking
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-slate-500 py-8 font-primary">Delivery tracking coming soon...</p>
          </CardContent>
        </Card>
      )}

      {activeSection === 'events' && (
        <Card className="border-slate-200">
          <CardHeader className="bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] text-white">
            <CardTitle className="flex items-center gap-2 font-heading">
              <AlertTriangle className="h-5 w-5" />
              Event Logging
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-center text-slate-500 py-8 font-primary">Event logging coming soon...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}