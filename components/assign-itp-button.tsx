'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { FileText, Calendar, User, Clock, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import type { Lot, ITP, TeamMember, CreateITPAssignment } from '../types'

interface AssignITPButtonProps {
  lot: Lot
  availableITPs: ITP[]
  teamMembers: TeamMember[]
  onAssign: (assignment: CreateITPAssignment) => Promise<void>
}

export function AssignITPButton({ lot, availableITPs, teamMembers, onAssign }: AssignITPButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedITPId, setSelectedITPId] = useState<string>('')
  const [assignedTo, setAssignedTo] = useState<string>('')
  const [scheduledDate, setScheduledDate] = useState<string>('')
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [notes, setNotes] = useState<string>('')

  const selectedITPDetails = availableITPs.find(itp => itp.id === selectedITPId)
  const selectedTeamMember = teamMembers.find(member => member.id === assignedTo)

  const calculateEstimatedCompletion = (): string => {
    if (!scheduledDate || !selectedITPDetails?.estimated_duration) return ''
    
    // Add validation for estimated_duration format
    const durationMatch = selectedITPDetails.estimated_duration.match(/(\d+)/)
    const durationDays = durationMatch ? parseInt(durationMatch[1]) : 1
    
    const scheduled = new Date(scheduledDate)
    const completion = new Date(scheduled.getTime() + (durationDays * 24 * 60 * 60 * 1000))
    
    return completion.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedITPId || !assignedTo || !scheduledDate) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    
    try {
      const assignmentData: CreateITPAssignment = {
        lot_id: lot.id,
        project_id: lot.project_id,
        itp_id: selectedITPId,
        assigned_to: assignedTo,
        scheduled_date: scheduledDate,
        estimated_completion_date: calculateEstimatedCompletion() || null,
        priority,
        notes: notes.trim() || null,
        organization_id: lot.project_id // This should be organization_id from context
      }

      await onAssign(assignmentData)
      
      toast.success('ITP assigned successfully!')
      setIsOpen(false)
      
      // Reset form
      setSelectedITPId('')
      setAssignedTo('')
      setScheduledDate('')
      setPriority('medium')
      setNotes('')
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign ITP')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2">
          <FileText className="w-5 h-5" />
          Assign ITP
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto" aria-describedby="dialog-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Assign Inspection & Test Plan
          </DialogTitle>
          <DialogDescription id="dialog-description">
            Assign an ITP to <span className="font-medium">{lot.name}</span> and schedule the inspection.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lot Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Lot Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lot Name:</span>
                <span className="text-sm font-medium">{lot.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Location:</span>
                <span className="text-sm">{lot.location || 'Not specified'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Priority:</span>
                <Badge variant={lot.priority === 'high' ? 'destructive' : lot.priority === 'medium' ? 'default' : 'secondary'}>
                  {lot.priority}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* ITP Selection */}
          <div className="space-y-2">
            <Label htmlFor="itp-select" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Select ITP *
            </Label>
            <Select value={selectedITPId} onValueChange={setSelectedITPId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an Inspection & Test Plan" />
              </SelectTrigger>
              <SelectContent>
                {availableITPs.map((itp) => (
                  <SelectItem key={itp.id} value={itp.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{itp.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {itp.category} • {itp.complexity} • {itp.estimated_duration}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedITPDetails && (
              <Card className="mt-2">
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <p className="text-sm">{selectedITPDetails.description}</p>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Duration: {selectedITPDetails.estimated_duration}</span>
                      <span>Complexity: {selectedITPDetails.complexity}</span>
                      {selectedITPDetails.required_certifications && selectedITPDetails.required_certifications.length > 0 && (
                        <span>Certifications: {selectedITPDetails.required_certifications.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Team Member Selection */}
          <div className="space-y-2">
            <Label htmlFor="assignee-select" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Assign To *
            </Label>
            <Select value={assignedTo} onValueChange={setAssignedTo}>
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{member.name || member.email}</span>
                      <span className="text-xs text-muted-foreground">
                        {member.role} • Workload: {member.current_workload}
                        {member.certifications.length > 0 && ` • ${member.certifications.join(', ')}`}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedTeamMember && selectedITPDetails?.required_certifications && (
              <div className="mt-2">
                {selectedITPDetails.required_certifications.some(cert => 
                  !selectedTeamMember.certifications.includes(cert)
                ) && (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    Missing required certifications: {
                      selectedITPDetails.required_certifications
                        .filter(cert => !selectedTeamMember.certifications.includes(cert))
                        .join(', ')
                    }
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduled-date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Scheduled Date *
              </Label>
              <Input
                id="scheduled-date"
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Estimated Completion
              </Label>
              <Input
                value={calculateEstimatedCompletion()}
                disabled
                placeholder="Auto-calculated"
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={(value: 'low' | 'medium' | 'high') => setPriority(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional instructions or requirements..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !selectedITPId || !assignedTo || !scheduledDate}>
              {isLoading ? 'Assigning...' : 'Assign ITP'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}