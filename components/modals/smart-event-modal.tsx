'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, MessageSquare, Shield, CheckCircle, FileText, Camera, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_TYPES = [
  { value: 'DELAY', label: 'Delay', icon: Clock, color: 'bg-red-500', description: 'Project delays & time impacts' },
  { value: 'INSTRUCTION', label: 'Instruction', icon: MessageSquare, color: 'bg-blue-500', description: 'Client/supervisor directions' },
  { value: 'SAFETY', label: 'Safety', icon: Shield, color: 'bg-yellow-500', description: 'Safety incidents & observations' },
  { value: 'QUALITY', label: 'Quality', icon: CheckCircle, color: 'bg-green-500', description: 'QA issues & inspections' },
  { value: 'GENERAL', label: 'General Note', icon: FileText, color: 'bg-gray-500', description: 'General observations' },
];

const DELAY_CAUSES = [
  'Weather Conditions',
  'Client/Principal',
  'Subcontractor Issue',
  'Site Access Problem',
  'Material Delivery',
  'Equipment Breakdown',
  'Design Change',
  'Utility Issues',
  'Permit/Approval Delays',
  'Other'
];

const SAFETY_TYPES = [
  'Near Miss',
  'Safety Observation',
  'Hazard Identified',
  'PPE Non-Compliance',
  'Unsafe Work Practice',
  'Environmental Concern',
  'First Aid Incident',
  'Other'
];

const QUALITY_TYPES = [
  'Defect Identified',
  'Rework Required',
  'Material Non-Conformance',
  'Inspection Hold',
  'Quality Improvement',
  'Testing Results',
  'Compliance Issue',
  'Other'
];

interface SmartEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lotData: { id: string };
  onEventSaved: () => void;
}

export function SmartEventModal({ open, onOpenChange, lotData, onEventSaved }: SmartEventModalProps) {
  const [isPending, startTransition] = useTransition();
  const [eventType, setEventType] = useState('');
  const [description, setDescription] = useState('');
  const [delayCause, setDelayCause] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [instructionFrom, setInstructionFrom] = useState('');
  const [safetyType, setSafetyType] = useState('');
  const [qualityType, setQualityType] = useState('');
  const [severity, setSeverity] = useState('');
  const [actionRequired, setActionRequired] = useState('');

  const handleSave = () => {
    if (!eventType || !description.trim()) {
      toast.error('Please select event type and add description');
      return;
    }

    startTransition(async () => {
      try {
        // Create smart event data structure
        const eventData = {
          event_type: eventType,
          description: description.trim(),
          lot_id: lotData.id,
          timestamp: new Date().toISOString(),
          metadata: {
            ...(eventType === 'DELAY' && {
              delay_cause: delayCause,
              estimated_duration: estimatedDuration ? parseFloat(estimatedDuration) : null
            }),
            ...(eventType === 'INSTRUCTION' && {
              instruction_from: instructionFrom
            }),
            ...(eventType === 'SAFETY' && {
              safety_type: safetyType,
              severity: severity
            }),
            ...(eventType === 'QUALITY' && {
              quality_type: qualityType,
              action_required: actionRequired
            })
          }
        };

        console.log('Smart Event Data:', eventData);
        
        // TODO: Implement server action for saving smart events
        // await saveSmartEventAction(eventData);
        
        toast.success(`${EVENT_TYPES.find(t => t.value === eventType)?.label} event recorded successfully!`);
        resetForm();
        onOpenChange(false);
        onEventSaved();
        
      } catch (error) {
        console.error('Error saving smart event:', error);
        toast.error('Failed to save event. Please try again.');
      }
    });
  };

  const resetForm = () => {
    setEventType('');
    setDescription('');
    setDelayCause('');
    setEstimatedDuration('');
    setInstructionFrom('');
    setSafetyType('');
    setQualityType('');
    setSeverity('');
    setActionRequired('');
  };

  const selectedEventType = EVENT_TYPES.find(type => type.value === eventType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Smart Evidence Engine - Record Site Event
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Capture intelligent, categorized events that build undeniable evidence chains for dispute resolution
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* Event Type Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Event Category</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EVENT_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = eventType === type.value;
                return (
                  <Button
                    key={type.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`h-20 flex-col gap-2 text-left p-4 ${
                      isSelected ? type.color + ' text-white hover:opacity-90' : ''
                    }`}
                    onClick={() => setEventType(type.value)}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs opacity-80 truncate">{type.description}</div>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Context-Driven Fields */}
          {eventType === 'DELAY' && (
            <div className="space-y-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <Clock className="h-4 w-4" />
                <span className="font-medium">Delay Event Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Cause of Delay</label>
                  <Select value={delayCause} onValueChange={setDelayCause}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select delay cause" />
                    </SelectTrigger>
                    <SelectContent>
                      {DELAY_CAUSES.map((cause) => (
                        <SelectItem key={cause} value={cause}>{cause}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Estimated Duration (hours)</label>
                  <Input 
                    type="number" 
                    step="0.5"
                    placeholder="e.g., 2.5"
                    value={estimatedDuration}
                    onChange={(e) => setEstimatedDuration(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {eventType === 'INSTRUCTION' && (
            <div className="space-y-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">Instruction Details</span>
              </div>
              <div>
                <label className="text-sm font-medium">Instruction From</label>
                <Input 
                  placeholder="Person/Company name (e.g., Site Supervisor, Client Representative)"
                  value={instructionFrom}
                  onChange={(e) => setInstructionFrom(e.target.value)}
                />
              </div>
            </div>
          )}

          {eventType === 'SAFETY' && (
            <div className="space-y-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Safety Event Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Safety Type</label>
                  <Select value={safetyType} onValueChange={setSafetyType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select safety type" />
                    </SelectTrigger>
                    <SelectContent>
                      {SAFETY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Severity Level</label>
                  <Select value={severity} onValueChange={setSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="CRITICAL">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {eventType === 'QUALITY' && (
            <div className="space-y-4 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Quality Event Details</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Quality Type</label>
                  <Select value={qualityType} onValueChange={setQualityType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select quality type" />
                    </SelectTrigger>
                    <SelectContent>
                      {QUALITY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Action Required</label>
                  <Input 
                    placeholder="Required action or follow-up"
                    value={actionRequired}
                    onChange={(e) => setActionRequired(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              Event Description
              {selectedEventType && (
                <Badge variant="secondary" className="text-xs">
                  {selectedEventType.label}
                </Badge>
              )}
            </label>
            <Textarea 
              placeholder="Detailed description of the event, including context, impact, and any relevant details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] mt-2"
            />
          </div>

          {/* Smart Evidence Features */}
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                <Camera className="h-5 w-5" />
                <MapPin className="h-4 w-4" />
                <span className="font-medium">Smart Evidence Capture</span>
              </div>
              <p className="text-sm text-muted-foreground">
                📸 Photo upload with auto-watermarking (project details, timestamp, GPS)<br/>
                🗺️ Automatic GPS coordinates and weather conditions<br/>
                🔗 Links to related QA items, labour records, and diary events<br/>
                📊 Timeline visualization for dispute resolution
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                Coming Soon: Full evidence chain integration
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={!eventType || !description.trim() || isPending}
              className={selectedEventType ? selectedEventType.color : ''}
            >
              {isPending ? 'Saving...' : `Save ${selectedEventType?.label || 'Event'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}