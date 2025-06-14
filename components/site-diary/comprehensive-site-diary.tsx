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

  const [equipmentForm, setEquipmentForm] = useState<EquipmentEntryForm>({
    equipment_type: '',
    operator: '',
    hours_used: 8,
    fuel_usage: 0,
    maintenance_issues: '',
    downtime_hours: 0,
    downtime_reason: ''
  })

  const [deliveryForm, setDeliveryForm] = useState<DeliveryEntryForm>({
    supplier: '',
    material_type: '',
    quantity: 0,
    unit: 'tonnes',
    delivery_time: '',
    quality_issues: '',
    received_by: '',
    delivery_docket: ''
  })

  const [eventForm, setEventForm] = useState<EventEntryForm>({
    category: 'OTHER',
    title: '',
    description: '',
    impact_level: 'LOW',
    event_time: '',
    responsible_party: '',
    follow_up_required: false
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

  // Add equipment entry
  const addEquipmentEntry = async () => {
    if (!siteDiary?.diary_entry || !equipmentForm.equipment_type || !equipmentForm.operator) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await siteDiaryService.addEquipmentEntry(siteDiary.diary_entry.id, equipmentForm)
      setEquipmentForm({
        equipment_type: '',
        operator: '',
        hours_used: 8,
        fuel_usage: 0,
        maintenance_issues: '',
        downtime_hours: 0,
        downtime_reason: ''
      })
      await loadSiteDiary()
      toast.success('Equipment entry added')
    } catch (error) {
      console.error('Error adding equipment entry:', error)
      toast.error('Failed to add equipment entry')
    }
  }

  // Add delivery entry
  const addDeliveryEntry = async () => {
    if (!siteDiary?.diary_entry || !deliveryForm.supplier || !deliveryForm.material_type || deliveryForm.quantity <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await siteDiaryService.addDeliveryEntry(siteDiary.diary_entry.id, deliveryForm)
      setDeliveryForm({
        supplier: '',
        material_type: '',
        quantity: 0,
        unit: 'tonnes',
        delivery_time: '',
        quality_issues: '',
        received_by: '',
        delivery_docket: ''
      })
      await loadSiteDiary()
      toast.success('Delivery entry added')
    } catch (error) {
      console.error('Error adding delivery entry:', error)
      toast.error('Failed to add delivery entry')
    }
  }

  // Add event entry
  const addEventEntry = async () => {
    if (!siteDiary?.diary_entry || !eventForm.title || !eventForm.description) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      await siteDiaryService.addEventEntry(siteDiary.diary_entry.id, eventForm)
      setEventForm({
        category: 'OTHER',
        title: '',
        description: '',
        impact_level: 'LOW',
        event_time: '',
        responsible_party: '',
        follow_up_required: false
      })
      await loadSiteDiary()
      toast.success('Event entry added')
    } catch (error) {
      console.error('Error adding event entry:', error)
      toast.error('Failed to add event entry')
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
              {section.id === 'equipment' && siteDiary && (
                <Badge className="ml-2 bg-white/20 text-white border-0">
                  {siteDiary.equipment_entries.length}
                </Badge>
              )}
              {section.id === 'deliveries' && siteDiary && (
                <Badge className="ml-2 bg-white/20 text-white border-0">
                  {siteDiary.delivery_entries.length}
                </Badge>
              )}
              {section.id === 'events' && siteDiary && (
                <Badge className="ml-2 bg-white/20 text-white border-0">
                  {siteDiary.event_entries.length}
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
        <div className="space-y-6">
          {/* Add Equipment Form */}
          <Card className="border-slate-200">
            <CardHeader className="bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] text-white">
              <CardTitle className="flex items-center gap-2 font-heading">
                <Truck className="h-5 w-5" />
                Add Equipment Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-primary">Equipment Type *</Label>
                  <Select value={equipmentForm.equipment_type} onValueChange={(value) => setEquipmentForm({...equipmentForm, equipment_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select equipment" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_EQUIPMENT.map((equipment) => (
                        <SelectItem key={equipment} value={equipment}>{equipment}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-primary">Operator Name *</Label>
                  <div className="flex">
                    <Input
                      value={equipmentForm.operator || ''}
                      onChange={(e) => setEquipmentForm({...equipmentForm, operator: e.target.value})}
                      placeholder="Operator name"
                    />
                    <VoiceInput
                      value={equipmentForm.operator || ''}
                      onChange={(value) => setEquipmentForm({...equipmentForm, operator: value})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-primary">Hours Used *</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={equipmentForm.hours_used}
                    onChange={(e) => setEquipmentForm({...equipmentForm, hours_used: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-primary">Fuel Usage (Litres)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={equipmentForm.fuel_usage || 0}
                    onChange={(e) => setEquipmentForm({...equipmentForm, fuel_usage: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <Label className="font-primary">Downtime Hours</Label>
                  <Input
                    type="number"
                    step="0.25"
                    min="0"
                    value={equipmentForm.downtime_hours || 0}
                    onChange={(e) => setEquipmentForm({...equipmentForm, downtime_hours: parseFloat(e.target.value) || 0})}
                  />
                </div>
              </div>

              {(equipmentForm.downtime_hours || 0) > 0 && (
                <div>
                  <Label className="font-primary">Downtime Reason</Label>
                  <div className="flex">
                    <Textarea
                      value={equipmentForm.downtime_reason || ''}
                      onChange={(e) => setEquipmentForm({...equipmentForm, downtime_reason: e.target.value})}
                      placeholder="Describe the reason for downtime..."
                      className="min-h-[80px]"
                    />
                    <VoiceInput
                      value={equipmentForm.downtime_reason || ''}
                      onChange={(value) => setEquipmentForm({...equipmentForm, downtime_reason: value})}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="font-primary">Maintenance Notes</Label>
                <div className="flex">
                  <Textarea
                    value={equipmentForm.maintenance_issues || ''}
                    onChange={(e) => setEquipmentForm({...equipmentForm, maintenance_issues: e.target.value})}
                    placeholder="Any maintenance performed or required..."
                    className="min-h-[80px]"
                  />
                  <VoiceInput
                    value={equipmentForm.maintenance_issues || ''}
                    onChange={(value) => setEquipmentForm({...equipmentForm, maintenance_issues: value})}
                  />
                </div>
              </div>

              <Button onClick={addEquipmentEntry} className="site-proof-btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Equipment Entry
              </Button>
            </CardContent>
          </Card>

          {/* Equipment Entries List */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="font-heading">Today's Equipment ({siteDiary?.equipment_entries.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {siteDiary?.equipment_entries.length ? (
                <div className="space-y-3">
                  {siteDiary.equipment_entries.map((entry) => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 font-heading">{entry.equipment_type}</h4>
                          <p className="text-sm text-slate-600 font-primary">
                            Operator: {entry.operator} • {entry.hours_used}h used
                            {(entry.fuel_usage || 0) > 0 && ` • ${entry.fuel_usage}L fuel`}
                          </p>
                          {entry.downtime_hours > 0 && (
                            <p className="text-sm text-amber-600 font-primary">
                              Downtime: {entry.downtime_hours}h - {entry.downtime_reason}
                            </p>
                          )}
                          {entry.maintenance_issues && (
                            <p className="text-sm text-slate-500 mt-1 font-primary">{entry.maintenance_issues}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {entry.downtime_hours > 0 && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300">Downtime</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8 font-primary">No equipment entries for today</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'deliveries' && (
        <div className="space-y-6">
          {/* Add Delivery Form */}
          <Card className="border-slate-200">
            <CardHeader className="bg-gradient-to-r from-[#F1C40F] to-[#F39C12]">
              <CardTitle className="flex items-center gap-2 text-slate-900 font-heading">
                <Package className="h-5 w-5" />
                Add Delivery Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-primary">Supplier *</Label>
                  <div className="flex">
                    <Input
                      value={deliveryForm.supplier}
                      onChange={(e) => setDeliveryForm({...deliveryForm, supplier: e.target.value})}
                      placeholder="Supplier name"
                    />
                    <VoiceInput
                      value={deliveryForm.supplier}
                      onChange={(value) => setDeliveryForm({...deliveryForm, supplier: value})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-primary">Material Type *</Label>
                  <div className="flex">
                    <Input
                      value={deliveryForm.material_type}
                      onChange={(e) => setDeliveryForm({...deliveryForm, material_type: e.target.value})}
                      placeholder="e.g., Concrete, Steel, Timber"
                    />
                    <VoiceInput
                      value={deliveryForm.material_type}
                      onChange={(value) => setDeliveryForm({...deliveryForm, material_type: value})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-primary">Delivery Time</Label>
                  <Input
                    type="time"
                    value={deliveryForm.delivery_time}
                    onChange={(e) => setDeliveryForm({...deliveryForm, delivery_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-primary">Quantity *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={deliveryForm.quantity}
                    onChange={(e) => setDeliveryForm({...deliveryForm, quantity: parseFloat(e.target.value) || 0})}
                  />
                </div>

                <div>
                  <Label className="font-primary">Unit</Label>
                  <Select value={deliveryForm.unit} onValueChange={(value) => setDeliveryForm({...deliveryForm, unit: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tonnes">Tonnes</SelectItem>
                      <SelectItem value="m3">Cubic Metres</SelectItem>
                      <SelectItem value="m2">Square Metres</SelectItem>
                      <SelectItem value="m">Linear Metres</SelectItem>
                      <SelectItem value="units">Units</SelectItem>
                      <SelectItem value="pallets">Pallets</SelectItem>
                      <SelectItem value="loads">Loads</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-primary">Received By *</Label>
                  <div className="flex">
                    <Input
                      value={deliveryForm.received_by}
                      onChange={(e) => setDeliveryForm({...deliveryForm, received_by: e.target.value})}
                      placeholder="Person who received"
                    />
                    <VoiceInput
                      value={deliveryForm.received_by}
                      onChange={(value) => setDeliveryForm({...deliveryForm, received_by: value})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-primary">Delivery Docket Number</Label>
                  <Input
                    value={deliveryForm.delivery_docket || ''}
                    onChange={(e) => setDeliveryForm({...deliveryForm, delivery_docket: e.target.value})}
                    placeholder="Docket/reference number"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="quality-issues"
                    checked={!!deliveryForm.quality_issues}
                    onChange={(e) => setDeliveryForm({...deliveryForm, quality_issues: e.target.checked ? 'Quality issues noted' : ''})}
                    className="rounded border-slate-300"
                  />
                  <Label htmlFor="quality-issues" className="font-primary">
                    Quality issues identified
                  </Label>
                </div>
              </div>

              {deliveryForm.quality_issues && (
                <div>
                  <Label className="font-primary">Quality Issues Description</Label>
                  <div className="flex">
                    <Textarea
                      value={deliveryForm.quality_issues}
                      onChange={(e) => setDeliveryForm({...deliveryForm, quality_issues: e.target.value})}
                      placeholder="Describe any quality issues or concerns..."
                      className="min-h-[80px]"
                    />
                    <VoiceInput
                      value={deliveryForm.quality_issues}
                      onChange={(value) => setDeliveryForm({...deliveryForm, quality_issues: value})}
                    />
                  </div>
                </div>
              )}

              <Button onClick={addDeliveryEntry} className="site-proof-btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Delivery Entry
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Entries List */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="font-heading">Today's Deliveries ({siteDiary?.delivery_entries.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {siteDiary?.delivery_entries.length ? (
                <div className="space-y-3">
                  {siteDiary.delivery_entries.map((entry) => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-900 font-heading">{entry.material_type}</h4>
                          <p className="text-sm text-slate-600 font-primary">
                            Supplier: {entry.supplier} • {entry.quantity} {entry.unit}
                            {entry.delivery_time && ` • ${entry.delivery_time}`}
                          </p>
                          <p className="text-sm text-slate-600 font-primary">
                            Received by: {entry.received_by}
                          </p>
                          {entry.delivery_docket && (
                            <p className="text-sm text-slate-500 font-primary">Docket: {entry.delivery_docket}</p>
                          )}
                          {entry.quality_issues && (
                            <p className="text-sm text-red-600 mt-1 font-primary">{entry.quality_issues}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {entry.quality_issues && (
                            <Badge className="bg-red-100 text-red-800 border-red-300">Quality Issues</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8 font-primary">No deliveries recorded for today</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === 'events' && (
        <div className="space-y-6">
          {/* Add Event Form */}
          <Card className="border-slate-200">
            <CardHeader className="bg-gradient-to-r from-[#1B4F72] to-[#2E86AB] text-white">
              <CardTitle className="flex items-center gap-2 font-heading">
                <AlertTriangle className="h-5 w-5" />
                Add Event Entry
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="font-primary">Event Category *</Label>
                  <Select value={eventForm.category} onValueChange={(value) => setEventForm({...eventForm, category: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {EVENT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-primary">Impact Level *</Label>
                  <Select value={eventForm.impact_level} onValueChange={(value) => setEventForm({...eventForm, impact_level: value as any})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select impact" />
                    </SelectTrigger>
                    <SelectContent>
                      {IMPACT_LEVELS.map((level) => (
                        <SelectItem key={level} value={level}>
                          {level.charAt(0) + level.slice(1).toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="font-primary">Event Time</Label>
                  <Input
                    type="time"
                    value={eventForm.event_time}
                    onChange={(e) => setEventForm({...eventForm, event_time: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-primary">Event Title *</Label>
                  <div className="flex">
                    <Input
                      value={eventForm.title}
                      onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                      placeholder="Brief title of the event"
                    />
                    <VoiceInput
                      value={eventForm.title}
                      onChange={(value) => setEventForm({...eventForm, title: value})}
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-primary">Responsible Party</Label>
                  <div className="flex">
                    <Input
                      value={eventForm.responsible_party || ''}
                      onChange={(e) => setEventForm({...eventForm, responsible_party: e.target.value})}
                      placeholder="Person/company responsible"
                    />
                    <VoiceInput
                      value={eventForm.responsible_party || ''}
                      onChange={(value) => setEventForm({...eventForm, responsible_party: value})}
                    />
                  </div>
                </div>
              </div>

              <div>
                <Label className="font-primary">Event Description *</Label>
                <div className="flex">
                  <Textarea
                    value={eventForm.description}
                    onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                    placeholder="Detailed description of what happened..."
                    className="min-h-[100px]"
                  />
                  <VoiceInput
                    value={eventForm.description}
                    onChange={(value) => setEventForm({...eventForm, description: value})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="follow-up-required"
                  checked={eventForm.follow_up_required || false}
                  onChange={(e) => setEventForm({...eventForm, follow_up_required: e.target.checked})}
                  className="rounded border-slate-300"
                />
                <Label htmlFor="follow-up-required" className="font-primary">
                  Follow-up action required
                </Label>
              </div>

              {eventForm.follow_up_required && (
                <div>
                  <Label className="font-primary">Follow-up Date</Label>
                  <Input
                    type="date"
                    value={eventForm.follow_up_date || ''}
                    onChange={(e) => setEventForm({...eventForm, follow_up_date: e.target.value})}
                  />
                </div>
              )}

              <Button onClick={addEventEntry} className="site-proof-btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Event Entry
              </Button>
            </CardContent>
          </Card>

          {/* Event Entries List */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="font-heading">Today's Events ({siteDiary?.event_entries.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {siteDiary?.event_entries.length ? (
                <div className="space-y-3">
                  {siteDiary.event_entries.map((entry) => (
                    <div key={entry.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900 font-heading">{entry.title}</h4>
                            <Badge className={`text-xs ${
                              entry.impact_level === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-300' :
                              entry.impact_level === 'HIGH' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                              entry.impact_level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              'bg-green-100 text-green-800 border-green-300'
                            }`}>
                              {entry.impact_level}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600 font-primary">
                            Category: {entry.category.replace('_', ' ')}
                            {entry.event_time && ` • ${entry.event_time}`}
                          </p>
                          <p className="text-sm text-slate-700 mt-1 font-primary">{entry.description}</p>
                          {entry.responsible_party && (
                            <p className="text-sm text-slate-600 font-primary">Responsible: {entry.responsible_party}</p>
                          )}
                          {entry.follow_up_required && (
                            <p className="text-sm text-blue-600 mt-1 font-primary">
                              Follow-up required{entry.follow_up_date && ` by ${new Date(entry.follow_up_date).toLocaleDateString()}`}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Badge className={`${
                            entry.category === 'SAFETY' ? 'bg-red-100 text-red-800 border-red-300' :
                            entry.category === 'DELAY' ? 'bg-orange-100 text-orange-800 border-orange-300' :
                            entry.category === 'QUALITY_ISSUE' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                            'bg-blue-100 text-blue-800 border-blue-300'
                          }`}>
                            {entry.category.replace('_', ' ')}
                          </Badge>
                          {entry.follow_up_required && (
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300">Follow-up</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-slate-500 py-8 font-primary">No events recorded for today</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}