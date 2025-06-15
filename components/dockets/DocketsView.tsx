'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Clock, DollarSign, User } from 'lucide-react'

interface DocketsViewProps {
  lotId: string
  projectId: string
}

interface LabourEntry {
  id: string
  personName: string
  company: string
  trade: string
  hoursWorked: number
  hourlyRate: number
  notes: string
  totalCost: number
}

const TRADES = [
  'General Labourer',
  'Carpenter',
  'Electrician',
  'Plumber',
  'Concrete Finisher',
  'Heavy Equipment Operator',
  'Surveyor',
  'Site Supervisor',
  'Safety Officer',
  'Welder',
  'Crane Operator',
  'Truck Driver'
]

export function DocketsView({ lotId, projectId }: DocketsViewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [entries, setEntries] = useState<LabourEntry[]>([])
  const [formData, setFormData] = useState({
    personName: '',
    company: '',
    trade: '',
    hoursWorked: '8.0',
    hourlyRate: '0.00',
    notes: ''
  })

  // Calculate totals
  const totalRecords = entries.length
  const totalHours = entries.reduce((sum, entry) => sum + entry.hoursWorked, 0)
  const totalCost = entries.reduce((sum, entry) => sum + entry.totalCost, 0)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 500)
    return () => clearTimeout(timer)
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleAddEntry = () => {
    if (!formData.personName || !formData.hoursWorked) {
      alert('Please fill in required fields')
      return
    }

    const hours = parseFloat(formData.hoursWorked)
    const rate = parseFloat(formData.hourlyRate)
    const cost = hours * rate

    const newEntry: LabourEntry = {
      id: Date.now().toString(),
      personName: formData.personName,
      company: formData.company,
      trade: formData.trade,
      hoursWorked: hours,
      hourlyRate: rate,
      notes: formData.notes,
      totalCost: cost
    }

    setEntries(prev => [...prev, newEntry])
    
    // Reset form
    setFormData({
      personName: '',
      company: '',
      trade: '',
      hoursWorked: '8.0',
      hourlyRate: '0.00',
      notes: ''
    })
  }

  const handleCancel = () => {
    setFormData({
      personName: '',
      company: '',
      trade: '',
      hoursWorked: '8.0',
      hourlyRate: '0.00',
      notes: ''
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-400">Loading dockets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-slate-900 min-h-screen p-6">
      {/* Summary Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Records */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm text-slate-300">
              <Users className="w-4 h-4 mr-2 text-blue-400" />
              Total Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{totalRecords}</p>
          </CardContent>
        </Card>

        {/* Total Hours */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm text-slate-300">
              <Clock className="w-4 h-4 mr-2 text-green-400" />
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">{totalHours.toFixed(1)}</p>
          </CardContent>
        </Card>

        {/* Total Cost */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-sm text-slate-300">
              <DollarSign className="w-4 h-4 mr-2 text-emerald-400" />
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-white">${totalCost.toFixed(2)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Labour Entry Form */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Add Labour Entry</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Person Name */}
            <div className="space-y-2">
              <Label htmlFor="personName" className="text-slate-300">
                Person Name *
              </Label>
              <div className="relative">
                <Input
                  id="personName"
                  placeholder="Enter person's name"
                  value={formData.personName}
                  onChange={(e) => handleInputChange('personName', e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 pl-10"
                />
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-slate-300">
                Company
              </Label>
              <Input
                id="company"
                placeholder="Company name"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white placeholder-slate-400"
              />
            </div>

            {/* Trade */}
            <div className="space-y-2">
              <Label htmlFor="trade" className="text-slate-300">
                Trade
              </Label>
              <Select value={formData.trade} onValueChange={(value) => handleInputChange('trade', value)}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select trade" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {TRADES.map((trade) => (
                    <SelectItem key={trade} value={trade} className="text-white hover:bg-slate-600">
                      {trade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hours Worked */}
            <div className="space-y-2">
              <Label htmlFor="hoursWorked" className="text-slate-300">
                Hours Worked *
              </Label>
              <Input
                id="hoursWorked"
                type="number"
                step="0.1"
                value={formData.hoursWorked}
                onChange={(e) => handleInputChange('hoursWorked', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            {/* Hourly Rate */}
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="hourlyRate" className="text-slate-300">
                Hourly Rate ($)
              </Label>
              <Input
                id="hourlyRate"
                type="number"
                step="0.01"
                value={formData.hourlyRate}
                onChange={(e) => handleInputChange('hourlyRate', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-slate-300">
              Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Additional notes or comments"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              className="bg-slate-700 border-slate-600 text-white placeholder-slate-400 min-h-20"
            />
          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleAddEntry}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Entry
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCancel}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Entries List (if any) */}
      {entries.length > 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Today's Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-slate-700 p-4 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white">{entry.personName}</h4>
                      <p className="text-sm text-slate-300">{entry.trade} - {entry.company}</p>
                      <p className="text-sm text-slate-400">
                        {entry.hoursWorked}h @ ${entry.hourlyRate}/h = ${entry.totalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}