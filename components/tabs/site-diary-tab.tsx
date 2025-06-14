'use client';

import { useState, useTransition } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { toast } from 'sonner';
import { saveSiteDiaryAction } from '../../actions';
import { CalendarIcon, CloudIcon } from 'lucide-react';
import type { FullLotData } from '../../types';

interface SiteDiaryTabProps {
  lotData: FullLotData;
}

export default function SiteDiaryTab({ lotData }: SiteDiaryTabProps) {
  const [isPending, startTransition] = useTransition();
  const [generalComments, setGeneralComments] = useState('');
  const [weather, setWeather] = useState('');
  
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const handleSave = () => {
    if (!generalComments.trim()) {
      toast.error('Please add some general comments before saving');
      return;
    }

    if (!weather) {
      toast.error('Please select weather conditions');
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('lotId', lotData.id);
        formData.append('reportDate', today);
        formData.append('generalComments', generalComments);
        formData.append('weather', weather);

        const result = await saveSiteDiaryAction(formData);
        toast.success(result.message);
        
        // Clear form after successful save
        setGeneralComments('');
        setWeather('');
        
        console.log('Diary saved with ID:', result.dailyReportId);
        
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to save site diary');
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Site Diary</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Weather Conditions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudIcon className="h-5 w-5" />
            Weather Conditions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={weather} onValueChange={setWeather}>
            <SelectTrigger>
              <SelectValue placeholder="Select weather conditions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sunny">☀️ Sunny</SelectItem>
              <SelectItem value="partly-cloudy">⛅ Partly Cloudy</SelectItem>
              <SelectItem value="cloudy">☁️ Cloudy</SelectItem>
              <SelectItem value="overcast">🌫️ Overcast</SelectItem>
              <SelectItem value="light-rain">🌦️ Light Rain</SelectItem>
              <SelectItem value="heavy-rain">🌧️ Heavy Rain</SelectItem>
              <SelectItem value="storm">⛈️ Storm</SelectItem>
              <SelectItem value="fog">🌫️ Fog</SelectItem>
              <SelectItem value="windy">💨 Windy</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* General Comments */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Activities & General Comments</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Describe the main activities, progress, and any general observations for today..."
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            className="min-h-[120px]"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isPending}
          className="min-w-[120px]"
        >
          {isPending ? 'Saving...' : 'Save Diary'}
        </Button>
      </div>

      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-100 rounded-full p-2">
              <CalendarIcon className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Daily Site Diary</h4>
              <p className="text-sm text-blue-700">
                Record today's weather conditions and general site activities. This information will be saved to the daily report for <strong>Lot {lotData.lot_number}</strong> on {new Date().toLocaleDateString()}.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}