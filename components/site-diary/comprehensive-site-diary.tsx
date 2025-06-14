'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Calendar, Users, Truck, Package, AlertTriangle, Save, Thermometer, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { VoiceTextarea } from '@/components/ui/voice-input'
import { toast } from 'sonner'
import { convertDiaryData, CompleteSiteDiary, SiteDiaryEntry } from '@/types/site-diary-compatibility'
import { EventCategory, ImpactLevel } from '@/types/site-diary'

// Constants
const WEATHER_CONDITIONS = ['sunny', 'partly_cloudy', 'cloudy', 'overcast', 'light_rain', 'rain', 'heavy_rain', 'storm', 'wind', 'fog']
const COMMON_TRADES = ['Carpenter', 'Electrician', 'Plumber', 'Concreter', 'Bricklayer', 'Roofer', 'Painter', 'Tiler', 'Glazier', 'Landscaper', 'General Labourer']
const COMMON_EQUIPMENT = ['Excavator', 'Bobcat', 'Crane', 'Concrete Pump', 'Forklift', 'Dump Truck', 'Compactor', 'Generator', 'Scaffolding', 'Concrete Mixer']
const COMMON_MATERIALS = ['Concrete', 'Steel', 'Timber', 'Bricks', 'Tiles', 'Insulation', 'Plasterboard', 'Paint', 'Electrical Cable', 'Plumbing Pipes']
const EVENT_CATEGORIES = [
  { value: 'DELAY' as EventCategory, label: 'Delay' },
  { value: 'INSTRUCTION' as EventCategory, label: 'Instruction' },
  { value: 'SAFETY' as EventCategory, label: 'Safety' },
  { value: 'WEATHER' as EventCategory, label: 'Weather' },
  { value: 'INSPECTION' as EventCategory, label: 'Inspection' },
  { value: 'QUALITY_ISSUE' as EventCategory, label: 'Quality Issue' },
  { value: 'VISITOR' as EventCategory, label: 'Visitor' },
  { value: 'MEETING' as EventCategory, label: 'Meeting' },
  { value: 'OTHER' as EventCategory, label: 'Other' }
]
const IMPACT_LEVELS = [
  { value: 'LOW' as ImpactLevel, label: 'Low' },
  { value: 'MEDIUM' as ImpactLevel, label: 'Medium' },
  { value: 'HIGH' as ImpactLevel, label: 'High' },
  { value: 'CRITICAL' as ImpactLevel, label: 'Critical' }
]

interface SiteDiaryProps {
  projectId: string
  projectName: string
  selectedDate: string
  lotNumber?: string
}

export function ComprehensiveSiteDiary({ 
  projectId, 
  projectName,
  selectedDate,
  lotNumber
}: SiteDiaryProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(false)
  
  // Site diary data - using proper typing
  const [siteDiary, setSiteDiary] = useState<SiteDiaryEntry | null>(null)

  // Diary entry state
  const [weatherConditions, setWeatherConditions] = useState('')
  const [temperature, setTemperature] = useState('')
  const [siteSupervisor, setSiteSupervisor] = useState('')
  const [safetyBriefing, setSafetyBriefing] = useState(false)
  const [generalNotes, setGeneralNotes] = useState('')

  // Form states
  const [manpowerForm, setManpowerForm] = useState({
    trade: '', workers_count: 0, hours_worked: 0, supervisor: '', notes: '', weather_impact: false, overtime_hours: 0
  })
  const [equipmentForm, setEquipmentForm] = useState({
    equipment_type: '', equipment_id: '', hours_used: 0, operator: '', maintenance_issues: '', downtime_reason: '', downtime_hours: 0, fuel_usage: 0
  })
  const [deliveryForm, setDeliveryForm] = useState({
    delivery_time: '', supplier: '', material_type: '', quantity: 0, unit: 'each', delivery_docket: '', received_by: '', quality_issues: '', rejection_reason: ''
  })
  const [eventForm, setEventForm] = useState({
    event_time: '', category: 'OTHER' as EventCategory, title: '', description: '', impact_level: 'LOW' as ImpactLevel, responsible_party: '', follow_up_required: false, follow_up_date: '', cost_impact: 0, time_impact_hours: 0
  })

  // Dialog states
  const [showManpowerDialog, setShowManpowerDialog] = useState(false)
  const [showEquipmentDialog, setShowEquipmentDialog] = useState(false)
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false)
  const [showEventDialog, setShowEventDialog] = useState(false)

  // Load data on mount
  useEffect(() => {
    const loadSiteDiary = async () => {
      setIsLoading(true)
      try {
        // Mock implementation - replace with actual service call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Mock CompleteSiteDiary data
        const mockCompleteDiary: CompleteSiteDiary = {
          diary_entry: {
            id: '1',
            project_id: projectId,
            date: selectedDate,
            weather_conditions: '',
            temperature_celsius: undefined,
            site_supervisor: '',
            safety_briefing_conducted: false,
            general_notes: '',
            created_by: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          manpower_entries: [],
          equipment_entries: [],
          delivery_entries: [],
          event_entries: []
        }
        
        // Convert to SiteDiaryEntry format
        const convertedDiary = convertDiaryData(mockCompleteDiary)
        setSiteDiary(convertedDiary)
      } catch (error) {
        console.error('Error loading site diary:', error)
        toast.error('Failed to load site diary')
      } finally {
        setIsLoading(false)
      }
    }
    loadSiteDiary()
  }, [projectId, selectedDate])

  // Save functions
  const saveDiaryEntry = async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    toast.success('Site diary updated successfully')
    setIsLoading(false)
  }

  const addManpowerEntry = async () => {
    if (!manpowerForm.trade || manpowerForm.workers_count <= 0) {
      toast.error('Please fill in all required fields')
      return
    }
    const newEntry = { 
      id: Date.now().toString(), 
      ...manpowerForm, 
      diary_entry_id: siteDiary?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSiteDiary(prev => prev ? {
      ...prev,
      manpower_entries: [...(prev.manpower_entries || []), newEntry]
    } : null)
    setManpowerForm({ trade: '', workers_count: 0, hours_worked: 0, supervisor: '', notes: '', weather_impact: false, overtime_hours: 0 })
    setShowManpowerDialog(false)
    toast.success('Manpower entry added')
  }

  const addEquipmentEntry = async () => {
    if (!equipmentForm.equipment_type || !equipmentForm.operator) {
      toast.error('Please fill in all required fields')
      return
    }
    const newEntry = { 
      id: Date.now().toString(), 
      ...equipmentForm, 
      diary_entry_id: siteDiary?.id || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSiteDiary(prev => prev ? {
      ...prev,
      equipment_entries: [...(prev.equipment_entries || []), newEntry]
    } : null)
    setEquipmentForm({ equipment_type: '', equipment_id: '', hours_used: 0, operator: '', maintenance_issues: '', downtime_reason: '', downtime_hours: 0, fuel_usage: 0 })
    setShowEquipmentDialog(false)
    toast.success('Equipment entry added')
  }

  const addDeliveryEntry = async () => {
    if (!deliveryForm.supplier || !deliveryForm.material_type || deliveryForm.quantity <= 0) {
      toast.error('Please fill in all required fields')
      return
    }
    const newEntry = { 
      id: Date.now().toString(), 
      ...deliveryForm, 
      diary_entry_id: siteDiary?.id || '',
      photos_attached: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSiteDiary(prev => prev ? {
      ...prev,
      delivery_entries: [...(prev.delivery_entries || []), newEntry]
    } : null)
    setDeliveryForm({ delivery_time: '', supplier: '', material_type: '', quantity: 0, unit: 'each', delivery_docket: '', received_by: '', quality_issues: '', rejection_reason: '' })
    setShowDeliveryDialog(false)
    toast.success('Delivery entry added')
  }

  const addEventEntry = async () => {
    if (!eventForm.title || !eventForm.description) {
      toast.error('Please fill in all required fields')
      return
    }
    const newEntry = { 
      id: Date.now().toString(), 
      ...eventForm, 
      diary_entry_id: siteDiary?.id || '',
      photos_attached: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSiteDiary(prev => prev ? {
      ...prev,
      event_entries: [...(prev.event_entries || []), newEntry]
    } : null)
    setEventForm({ event_time: '', category: 'OTHER', title: '', description: '', impact_level: 'LOW', responsible_party: '', follow_up_required: false, follow_up_date: '', cost_impact: 0, time_impact_hours: 0 })
    setShowEventDialog(false)
    toast.success('Event entry added')
  }

  if (isLoading && !siteDiary) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B4F72] mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading site diary...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 max-w-7xl mx-auto">
      {/* Header */}
      <Card className="border-[#1B4F72]/20">
        <CardHeader className="bg-gradient-to-r from-[#1B4F72]/5 to-[#F1C40F]/5">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 font-heading text-[#1B4F72]">
                <Calendar className="h-5 w-5" />
                Site Diary - {new Date(selectedDate).toLocaleDateString('en-AU')}
              </CardTitle>
              <CardDescription className="font-primary">
                {projectName} {lotNumber && `- Lot ${lotNumber}`}
              </CardDescription>
            </div>
            <Button onClick={saveDiaryEntry} disabled={isLoading} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Entry'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-[#1B4F72] font-heading">{siteDiary?.manpower_entries?.length || 0}</div>
              <div className="text-sm text-muted-foreground font-primary">Manpower</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 font-heading">{siteDiary?.equipment_entries?.length || 0}</div>
              <div className="text-sm text-muted-foreground font-primary">Equipment</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 font-heading">{siteDiary?.delivery_entries?.length || 0}</div>
              <div className="text-sm text-muted-foreground font-primary">Deliveries</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 font-heading">{siteDiary?.event_entries?.length || 0}</div>
              <div className="text-sm text-muted-foreground font-primary">Events</div>
            </div>
          </div>

          {/* Site Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label className="font-primary text-[#1B4F72]">Weather Conditions</Label>
              <Select value={weatherConditions} onValueChange={setWeatherConditions}>
                <SelectTrigger className="border-[#1B4F72]/20">
                  <SelectValue placeholder="Select weather" />
                </SelectTrigger>
                <SelectContent>
                  {WEATHER_CONDITIONS.map((weather) => (
                    <SelectItem key={weather} value={weather}>
                      {weather.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-primary text-[#1B4F72]">Temperature (°C)</Label>
              <div className="relative">
                <Input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  placeholder="25"
                  className="border-[#1B4F72]/20"
                />
                <Thermometer className="absolute right-3 top-3 h-4 w-4 text-slate-500" />
              </div>
            </div>
            <div>
              <Label className="font-primary text-[#1B4F72]">Site Supervisor</Label>
              <Input
                value={siteSupervisor}
                onChange={(e) => setSiteSupervisor(e.target.value)}
                placeholder="Supervisor name"
                className="border-[#1B4F72]/20"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="safety-briefing"
                checked={safetyBriefing}
                onChange={(e) => setSafetyBriefing(e.target.checked)}
                className="rounded border-[#1B4F72]/20"
              />
              <Label htmlFor="safety-briefing" className="flex items-center gap-2 font-primary text-[#1B4F72]">
                <Shield className="h-4 w-4 text-[#1B4F72]" />
                Safety briefing conducted
              </Label>
            </div>
            <div>
              <Label className="font-primary text-[#1B4F72]">General Notes</Label>
              <VoiceTextarea
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                placeholder="General site observations, weather impacts, overall progress..."
                className="min-h-[80px] border-[#1B4F72]/20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#1B4F72]/10">
          <TabsTrigger value="manpower" className="flex items-center gap-2 data-[state=active]:bg-[#1B4F72] data-[state=active]:text-white font-primary">
            <Users className="h-4 w-4" />
            Manpower ({siteDiary?.manpower_entries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2 data-[state=active]:bg-[#1B4F72] data-[state=active]:text-white font-primary">
            <Truck className="h-4 w-4" />
            Equipment ({siteDiary?.equipment_entries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="deliveries" className="flex items-center gap-2 data-[state=active]:bg-[#1B4F72] data-[state=active]:text-white font-primary">
            <Package className="h-4 w-4" />
            Deliveries ({siteDiary?.delivery_entries?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 data-[state=active]:bg-[#1B4F72] data-[state=active]:text-white font-primary">
            <AlertTriangle className="h-4 w-4" />
            Events ({siteDiary?.event_entries?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Manpower Tab */}
        <TabsContent value="manpower" className="space-y-4">
          <Card className="border-[#1B4F72]/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-[#1B4F72]">Today's Manpower ({siteDiary?.manpower_entries?.length || 0})</CardTitle>
                <Dialog open={showManpowerDialog} onOpenChange={setShowManpowerDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Manpower
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-[#1B4F72]">Add Manpower Entry</DialogTitle>
                      <DialogDescription className="font-primary">Record worker allocation for this date</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Trade</Label>
                          <Select value={manpowerForm.trade} onValueChange={(value) => setManpowerForm({...manpowerForm, trade: value})}>
                            <SelectTrigger className="border-[#1B4F72]/20">
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
                          <Label className="font-primary text-[#1B4F72]">Number of Workers</Label>
                          <Input
                            type="number"
                            value={manpowerForm.workers_count}
                            onChange={(e) => setManpowerForm({...manpowerForm, workers_count: parseInt(e.target.value) || 0})}
                            min="1"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Hours Worked</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={manpowerForm.hours_worked}
                            onChange={(e) => setManpowerForm({...manpowerForm, hours_worked: parseFloat(e.target.value) || 0})}
                            min="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Overtime Hours</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={manpowerForm.overtime_hours}
                            onChange={(e) => setManpowerForm({...manpowerForm, overtime_hours: parseFloat(e.target.value) || 0})}
                            min="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Supervisor</Label>
                        <Input
                          value={manpowerForm.supervisor}
                          onChange={(e) => setManpowerForm({...manpowerForm, supervisor: e.target.value})}
                          placeholder="Supervisor name"
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="weather-impact"
                          checked={manpowerForm.weather_impact}
                          onChange={(e) => setManpowerForm({...manpowerForm, weather_impact: e.target.checked})}
                          className="rounded border-[#1B4F72]/20"
                        />
                        <Label htmlFor="weather-impact" className="font-primary text-[#1B4F72]">Work affected by weather</Label>
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Notes</Label>
                        <VoiceTextarea
                          value={manpowerForm.notes}
                          onChange={(e) => setManpowerForm({...manpowerForm, notes: e.target.value})}
                          placeholder="Additional notes about manpower allocation..."
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowManpowerDialog(false)} className="font-primary">Cancel</Button>
                        <Button onClick={addManpowerEntry} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">Add Entry</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {siteDiary?.manpower_entries?.length ? (
                <div className="space-y-4">
                  {siteDiary.manpower_entries.map((entry: any) => (
                    <Card key={entry.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Trade</Label>
                            <div className="font-medium font-primary">{entry.trade}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Workers</Label>
                            <div className="font-medium font-primary">{entry.workers_count}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Hours</Label>
                            <div className="font-medium font-primary">{entry.hours_worked}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Supervisor</Label>
                            <div className="font-medium font-primary">{entry.supervisor || 'N/A'}</div>
                          </div>
                        </div>
                        {entry.notes && (
                          <div className="mt-4">
                            <Label className="text-sm text-muted-foreground font-primary">Notes</Label>
                            <div className="text-sm font-primary">{entry.notes}</div>
                          </div>
                        )}
                        {entry.weather_impact && <Badge variant="secondary" className="mt-2">Weather Impact</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-primary">No manpower entries recorded for this date</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Equipment Tab */}
        <TabsContent value="equipment" className="space-y-4">
          <Card className="border-[#1B4F72]/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-[#1B4F72]">Today's Equipment ({siteDiary?.equipment_entries?.length || 0})</CardTitle>
                <Dialog open={showEquipmentDialog} onOpenChange={setShowEquipmentDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-[#1B4F72]">Add Equipment Entry</DialogTitle>
                      <DialogDescription className="font-primary">Record equipment usage for this date</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Equipment Type</Label>
                          <Select value={equipmentForm.equipment_type} onValueChange={(value) => setEquipmentForm({...equipmentForm, equipment_type: value})}>
                            <SelectTrigger className="border-[#1B4F72]/20">
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
                          <Label className="font-primary text-[#1B4F72]">Operator</Label>
                          <Input
                            value={equipmentForm.operator}
                            onChange={(e) => setEquipmentForm({...equipmentForm, operator: e.target.value})}
                            placeholder="Operator name"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Hours Used</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={equipmentForm.hours_used}
                            onChange={(e) => setEquipmentForm({...equipmentForm, hours_used: parseFloat(e.target.value) || 0})}
                            min="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Fuel Used (L)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={equipmentForm.fuel_usage}
                            onChange={(e) => setEquipmentForm({...equipmentForm, fuel_usage: parseFloat(e.target.value) || 0})}
                            min="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Downtime (hrs)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={equipmentForm.downtime_hours}
                            onChange={(e) => setEquipmentForm({...equipmentForm, downtime_hours: parseFloat(e.target.value) || 0})}
                            min="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Equipment ID</Label>
                        <Input
                          value={equipmentForm.equipment_id}
                          onChange={(e) => setEquipmentForm({...equipmentForm, equipment_id: e.target.value})}
                          placeholder="Equipment ID (optional)"
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Maintenance Issues</Label>
                        <VoiceTextarea
                          value={equipmentForm.maintenance_issues}
                          onChange={(e) => setEquipmentForm({...equipmentForm, maintenance_issues: e.target.value})}
                          placeholder="Any maintenance issues or observations..."
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Downtime Reason</Label>
                        <VoiceTextarea
                          value={equipmentForm.downtime_reason}
                          onChange={(e) => setEquipmentForm({...equipmentForm, downtime_reason: e.target.value})}
                          placeholder="Reason for any downtime..."
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEquipmentDialog(false)} className="font-primary">Cancel</Button>
                        <Button onClick={addEquipmentEntry} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">Add Entry</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {siteDiary?.equipment_entries?.length ? (
                <div className="space-y-4">
                  {siteDiary.equipment_entries.map((entry: any) => (
                    <Card key={entry.id} className="border-l-4 border-l-green-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Equipment</Label>
                            <div className="font-medium font-primary">{entry.equipment_type}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Operator</Label>
                            <div className="font-medium font-primary">{entry.operator}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Hours Used</Label>
                            <div className="font-medium font-primary">{entry.hours_used}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Equipment ID</Label>
                            <div className="font-medium font-primary">{entry.equipment_id || 'N/A'}</div>
                          </div>
                        </div>
                        {(entry.maintenance_issues || entry.downtime_reason) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {entry.maintenance_issues && (
                              <div>
                                <Label className="text-sm text-muted-foreground font-primary">Maintenance Issues</Label>
                                <div className="text-sm font-primary">{entry.maintenance_issues}</div>
                              </div>
                            )}
                            {entry.downtime_reason && (
                              <div>
                                <Label className="text-sm text-muted-foreground font-primary">Downtime Reason</Label>
                                <div className="text-sm font-primary">{entry.downtime_reason}</div>
                              </div>
                            )}
                          </div>
                        )}
                        {entry.fuel_usage > 0 && (
                          <div className="mt-2">
                            <Badge variant="outline">Fuel Used: {entry.fuel_usage}L</Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-primary">No equipment entries recorded for this date</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-4">
          <Card className="border-[#1B4F72]/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-[#1B4F72]">Today's Deliveries ({siteDiary?.delivery_entries?.length || 0})</CardTitle>
                <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Delivery
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-[#1B4F72]">Add Delivery Entry</DialogTitle>
                      <DialogDescription className="font-primary">Record material delivery for this date</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Delivery Time</Label>
                          <Input
                            type="time"
                            value={deliveryForm.delivery_time}
                            onChange={(e) => setDeliveryForm({...deliveryForm, delivery_time: e.target.value})}
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Supplier</Label>
                          <Input
                            value={deliveryForm.supplier}
                            onChange={(e) => setDeliveryForm({...deliveryForm, supplier: e.target.value})}
                            placeholder="Supplier name"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Material Type</Label>
                          <Select value={deliveryForm.material_type} onValueChange={(value) => setDeliveryForm({...deliveryForm, material_type: value})}>
                            <SelectTrigger className="border-[#1B4F72]/20">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                            <SelectContent>
                              {COMMON_MATERIALS.map((material) => (
                                <SelectItem key={material} value={material}>{material}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Quantity</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={deliveryForm.quantity}
                            onChange={(e) => setDeliveryForm({...deliveryForm, quantity: parseFloat(e.target.value) || 0})}
                            min="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Unit</Label>
                          <Select value={deliveryForm.unit} onValueChange={(value) => setDeliveryForm({...deliveryForm, unit: value})}>
                            <SelectTrigger className="border-[#1B4F72]/20">
                              <SelectValue placeholder="Unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="each">Each</SelectItem>
                              <SelectItem value="m3">m³</SelectItem>
                              <SelectItem value="tonnes">Tonnes</SelectItem>
                              <SelectItem value="m2">m²</SelectItem>
                              <SelectItem value="metres">Metres</SelectItem>
                              <SelectItem value="kg">kg</SelectItem>
                              <SelectItem value="litres">Litres</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Delivery Docket #</Label>
                          <Input
                            value={deliveryForm.delivery_docket}
                            onChange={(e) => setDeliveryForm({...deliveryForm, delivery_docket: e.target.value})}
                            placeholder="Optional docket number"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Received By</Label>
                          <Input
                            value={deliveryForm.received_by}
                            onChange={(e) => setDeliveryForm({...deliveryForm, received_by: e.target.value})}
                            placeholder="Person who received delivery"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Quality Issues</Label>
                        <VoiceTextarea
                          value={deliveryForm.quality_issues}
                          onChange={(e) => setDeliveryForm({...deliveryForm, quality_issues: e.target.value})}
                          placeholder="Any quality issues with the delivery..."
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Rejection Reason</Label>
                        <VoiceTextarea
                          value={deliveryForm.rejection_reason}
                          onChange={(e) => setDeliveryForm({...deliveryForm, rejection_reason: e.target.value})}
                          placeholder="Reason if delivery was rejected..."
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowDeliveryDialog(false)} className="font-primary">Cancel</Button>
                        <Button onClick={addDeliveryEntry} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">Add Entry</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {siteDiary?.delivery_entries?.length ? (
                <div className="space-y-4">
                  {siteDiary.delivery_entries.map((entry: any) => (
                    <Card key={entry.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Material</Label>
                            <div className="font-medium font-primary">{entry.material_type}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Quantity</Label>
                            <div className="font-medium font-primary">{entry.quantity} {entry.unit}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Supplier</Label>
                            <div className="font-medium font-primary">{entry.supplier}</div>
                          </div>
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Delivery Time</Label>
                            <div className="font-medium font-primary">{entry.delivery_time}</div>
                          </div>
                        </div>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm text-muted-foreground font-primary">Received By</Label>
                            <div className="text-sm font-primary">{entry.received_by}</div>
                          </div>
                          {entry.delivery_docket && (
                            <div>
                              <Label className="text-sm text-muted-foreground font-primary">Docket #</Label>
                              <div className="text-sm font-primary">{entry.delivery_docket}</div>
                            </div>
                          )}
                        </div>
                        {(entry.quality_issues || entry.rejection_reason) && (
                          <div className="mt-4">
                            <Label className="text-sm text-muted-foreground font-primary">Issues</Label>
                            <div className="text-sm text-red-600 font-primary">
                              {entry.quality_issues || entry.rejection_reason}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-primary">No deliveries recorded for this date</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          <Card className="border-[#1B4F72]/20">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="font-heading text-[#1B4F72]">Today's Events ({siteDiary?.event_entries?.length || 0})</CardTitle>
                <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Event
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="font-heading text-[#1B4F72]">Add Event Entry</DialogTitle>
                      <DialogDescription className="font-primary">Record significant site event for this date</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Event Time</Label>
                          <Input
                            type="time"
                            value={eventForm.event_time}
                            onChange={(e) => setEventForm({...eventForm, event_time: e.target.value})}
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Category</Label>
                          <Select value={eventForm.category} onValueChange={(value) => setEventForm({...eventForm, category: value as EventCategory})}>
                            <SelectTrigger className="border-[#1B4F72]/20">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {EVENT_CATEGORIES.map((cat) => (
                                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Event Title</Label>
                        <Input
                          value={eventForm.title}
                          onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
                          placeholder="Brief title for the event"
                          className="border-[#1B4F72]/20"
                        />
                      </div>
                      <div>
                        <Label className="font-primary text-[#1B4F72]">Description</Label>
                        <VoiceTextarea
                          value={eventForm.description}
                          onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
                          placeholder="Detailed description of the event..."
                          className="min-h-[80px] border-[#1B4F72]/20"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Impact Level</Label>
                          <Select value={eventForm.impact_level} onValueChange={(value) => setEventForm({...eventForm, impact_level: value as ImpactLevel})}>
                            <SelectTrigger className="border-[#1B4F72]/20">
                              <SelectValue placeholder="Select impact" />
                            </SelectTrigger>
                            <SelectContent>
                              {IMPACT_LEVELS.map((impact) => (
                                <SelectItem key={impact.value} value={impact.value}>{impact.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Responsible Party</Label>
                          <Input
                            value={eventForm.responsible_party}
                            onChange={(e) => setEventForm({...eventForm, responsible_party: e.target.value})}
                            placeholder="Who is responsible"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Cost Impact ($)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={eventForm.cost_impact}
                            onChange={(e) => setEventForm({...eventForm, cost_impact: parseFloat(e.target.value) || 0})}
                            min="0"
                            placeholder="0.00"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Time Impact (hours)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            value={eventForm.time_impact_hours}
                            onChange={(e) => setEventForm({...eventForm, time_impact_hours: parseFloat(e.target.value) || 0})}
                            min="0"
                            placeholder="0"
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="follow-up"
                          checked={eventForm.follow_up_required}
                          onChange={(e) => setEventForm({...eventForm, follow_up_required: e.target.checked})}
                          className="rounded border-[#1B4F72]/20"
                        />
                        <Label htmlFor="follow-up" className="font-primary text-[#1B4F72]">Follow-up required</Label>
                      </div>
                      {eventForm.follow_up_required && (
                        <div>
                          <Label className="font-primary text-[#1B4F72]">Follow-up Date</Label>
                          <Input
                            type="date"
                            value={eventForm.follow_up_date}
                            onChange={(e) => setEventForm({...eventForm, follow_up_date: e.target.value})}
                            className="border-[#1B4F72]/20"
                          />
                        </div>
                      )}
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowEventDialog(false)} className="font-primary">Cancel</Button>
                        <Button onClick={addEventEntry} className="bg-[#1B4F72] hover:bg-[#1B4F72]/90 text-white font-primary">Add Entry</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {siteDiary?.event_entries?.length ? (
                <div className="space-y-4">
                  {siteDiary.event_entries.map((entry: any) => (
                    <Card key={entry.id} className="border-l-4 border-l-red-500">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="font-primary">{entry.category}</Badge>
                              <Badge
                                variant={entry.impact_level === 'HIGH' || entry.impact_level === 'CRITICAL' ? 'destructive' : 'secondary'}
                                className="font-primary"
                              >
                                {entry.impact_level} Impact
                              </Badge>
                              <span className="text-sm text-muted-foreground font-primary">{entry.event_time}</span>
                            </div>
                            <h4 className="font-medium font-heading text-[#1B4F72]">{entry.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1 font-primary">{entry.description}</p>
                            {entry.responsible_party && (
                              <div className="mt-2">
                                <Label className="text-sm text-muted-foreground font-primary">Responsible Party</Label>
                                <div className="text-sm font-primary">{entry.responsible_party}</div>
                              </div>
                            )}
                            {entry.follow_up_required && (
                              <div className="mt-2">
                                <Badge variant="outline" className="font-primary">Follow-up Required</Badge>
                                {entry.follow_up_date && (
                                  <span className="text-sm text-muted-foreground ml-2 font-primary">
                                    by {new Date(entry.follow_up_date).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {(entry.cost_impact > 0 || entry.time_impact_hours > 0) && (
                              <div className="mt-2 flex gap-4">
                                {entry.cost_impact > 0 && (
                                  <span className="text-sm text-red-600 font-primary">Cost Impact: ${entry.cost_impact}</span>
                                )}
                                {entry.time_impact_hours > 0 && (
                                  <span className="text-sm text-red-600 font-primary">Time Impact: {entry.time_impact_hours}h</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground font-primary">No events recorded for this date</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}