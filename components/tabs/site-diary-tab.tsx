'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { CalendarDays, Cloud, Sun, CloudRain, CloudSnow, Wind, Plus, Save } from 'lucide-react'
import type { FullLotData } from '../../types'

interface SiteDiaryTabProps {
  lotData: FullLotData
}

export default function SiteDiaryTab({ lotData }: SiteDiaryTabProps) {
  const [isAddingEntry, setIsAddingEntry] = useState(false)
  const [newEntry, setNewEntry] = useState({
    weather_conditions: '',
    temperature_min: '',
    temperature_max: '',
    wind_conditions: '',
    activities_completed: '',
    issues_encountered: '',
    notes: ''
  })

  // Mock data for demonstration - in real app this would come from database
  const mockEntries = [
    {
      id: '1',
      date: new Date().toISOString().split('T')[0],
      weather_conditions: 'Partly Cloudy',
      temperature_min: 18,
      temperature_max: 24,
      wind_conditions: 'Light breeze 10-15 km/h',
      activities_completed: 'Concrete pour for foundation section A, Steel reinforcement installation',
      issues_encountered: 'Minor delay due to concrete truck arrival',
      notes: 'Good progress overall. Foundation work on schedule.',
      created_by: 'Site Supervisor'
    }
  ]

  const weatherOptions = [
    { value: 'sunny', label: 'Sunny', icon: Sun },
    { value: 'partly_cloudy', label: 'Partly Cloudy', icon: Cloud },
    { value: 'cloudy', label: 'Cloudy', icon: Cloud },
    { value: 'rainy', label: 'Rainy', icon: CloudRain },
    { value: 'stormy', label: 'Stormy', icon: CloudRain },
    { value: 'snowy', label: 'Snowy', icon: CloudSnow },
    { value: 'windy', label: 'Windy', icon: Wind }
  ]

  const getWeatherIcon = (weather: string) => {
    const option = weatherOptions.find(opt => opt.value === weather.toLowerCase().replace(' ', '_'))
    return option?.icon || Cloud
  }

  const getWeatherColor = (weather: string) => {
    switch (weather.toLowerCase()) {
      case 'sunny':
        return 'bg-yellow-100 text-yellow-800'
      case 'partly cloudy':
      case 'cloudy':
        return 'bg-gray-100 text-gray-800'
      case 'rainy':
      case 'stormy':
        return 'bg-blue-100 text-blue-800'
      case 'snowy':
        return 'bg-blue-50 text-blue-900'
      case 'windy':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleSaveEntry = () => {
    // In real app, this would save to database
    console.log('Saving site diary entry:', newEntry)
    setIsAddingEntry(false)
    setNewEntry({
      weather_conditions: '',
      temperature_min: '',
      temperature_max: '',
      wind_conditions: '',
      activities_completed: '',
      issues_encountered: '',
      notes: ''
    })
  }

  return (
    <div className="space-y-6">
      {/* Header with Add Entry Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Site Diary</h3>
          <p className="text-muted-foreground">Daily weather conditions and site activities</p>
        </div>
        <Button 
          onClick={() => setIsAddingEntry(true)}
          disabled={isAddingEntry}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Add New Entry Form */}
      {isAddingEntry && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              New Site Diary Entry - {new Date().toLocaleDateString()}
            </CardTitle>
            <CardDescription>
              Record today's weather conditions and site activities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weather Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weather">Weather Conditions</Label>
                <Select 
                  value={newEntry.weather_conditions} 
                  onValueChange={(value) => setNewEntry(prev => ({ ...prev, weather_conditions: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select weather conditions" />
                  </SelectTrigger>
                  <SelectContent>
                    {weatherOptions.map((option) => (
                      <SelectItem key={option.value} value={option.label}>
                        <div className="flex items-center gap-2">
                          <option.icon className="h-4 w-4" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="wind">Wind Conditions</Label>
                <Input
                  id="wind"
                  placeholder="e.g., Light breeze 10-15 km/h"
                  value={newEntry.wind_conditions}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, wind_conditions: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temp-min">Min Temperature (°C)</Label>
                <Input
                  id="temp-min"
                  type="number"
                  placeholder="18"
                  value={newEntry.temperature_min}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, temperature_min: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temp-max">Max Temperature (°C)</Label>
                <Input
                  id="temp-max"
                  type="number"
                  placeholder="24"
                  value={newEntry.temperature_max}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, temperature_max: e.target.value }))}
                />
              </div>
            </div>

            {/* Activities Section */}
            <div className="space-y-2">
              <Label htmlFor="activities">Activities Completed</Label>
              <Textarea
                id="activities"
                placeholder="Describe the main activities completed today..."
                value={newEntry.activities_completed}
                onChange={(e) => setNewEntry(prev => ({ ...prev, activities_completed: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="issues">Issues Encountered</Label>
              <Textarea
                id="issues"
                placeholder="Any delays, problems, or concerns..."
                value={newEntry.issues_encountered}
                onChange={(e) => setNewEntry(prev => ({ ...prev, issues_encountered: e.target.value }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                placeholder="Any other relevant information..."
                value={newEntry.notes}
                onChange={(e) => setNewEntry(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSaveEntry}>
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingEntry(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Entries */}
      <div className="space-y-4">
        {mockEntries.map((entry) => {
          const WeatherIcon = getWeatherIcon(entry.weather_conditions)
          return (
            <Card key={entry.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    {new Date(entry.date).toLocaleDateString('en-AU', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </CardTitle>
                  <Badge className={getWeatherColor(entry.weather_conditions)}>
                    <WeatherIcon className="h-3 w-3 mr-1" />
                    {entry.weather_conditions}
                  </Badge>
                </div>
                <CardDescription>
                  Recorded by {entry.created_by}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Weather Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Temperature</p>
                    <p className="text-lg font-semibold">{entry.temperature_min}°C - {entry.temperature_max}°C</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Wind</p>
                    <p className="text-lg">{entry.wind_conditions}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Conditions</p>
                    <div className="flex items-center justify-center gap-1">
                      <WeatherIcon className="h-4 w-4" />
                      <span className="text-lg">{entry.weather_conditions}</span>
                    </div>
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <h4 className="font-medium mb-2">Activities Completed</h4>
                  <p className="text-muted-foreground">{entry.activities_completed}</p>
                </div>

                {entry.issues_encountered && (
                  <div>
                    <h4 className="font-medium mb-2">Issues Encountered</h4>
                    <p className="text-muted-foreground">{entry.issues_encountered}</p>
                  </div>
                )}

                {entry.notes && (
                  <div>
                    <h4 className="font-medium mb-2">Additional Notes</h4>
                    <p className="text-muted-foreground">{entry.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {mockEntries.length === 0 && !isAddingEntry && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
            <h4 className="text-lg font-medium mb-2">No diary entries yet</h4>
            <p className="text-muted-foreground text-center mb-4">
              Start recording daily weather conditions and site activities
            </p>
            <Button onClick={() => setIsAddingEntry(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Entry
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}