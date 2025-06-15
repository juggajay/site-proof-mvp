'use client'

import { useState, useEffect, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '../../lib/supabase/client'
import { getITPsByProject } from '../../lib/supabase/itps'
import { createLotAction } from '../../actions'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Textarea } from '../ui/textarea'
import type { ITP } from '../../types'

const lotSchema = z.object({
  lotNumber: z.string().min(1, { message: 'Lot number is required.' }),
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  itpId: z.string().uuid({ message: 'Please select a valid ITP template.' }),
  projectId: z.string().uuid({ message: 'Invalid project ID.' }),
})

type LotFormValues = z.infer<typeof lotSchema>

interface CreateLotModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
}

export default function CreateLotModal({ open, onOpenChange, projectId }: CreateLotModalProps) {
  const [itps, setItps] = useState<{id: string, title: string, description: string}[]>([])
  const [isPending, startTransition] = useTransition()
  const [isLoadingItps, setIsLoadingItps] = useState(false)
  const supabase = createClient()

  const form = useForm<LotFormValues>({
    resolver: zodResolver(lotSchema),
    defaultValues: {
      lotNumber: '',
      description: '',
      itpId: '',
      projectId: projectId,
    },
  })

  // Fetch ITPs when modal opens
  useEffect(() => {
    if (open && projectId) {
      const fetchItps = async () => {
        console.log('🔍 CreateLotModal: Fetching ITPs for project:', projectId)
        setIsLoadingItps(true)
        
        try {
          // Use the proper service function with project filtering
          const itpData = await getITPsByProject(projectId)
          console.log('📊 CreateLotModal: Received ITP data:', itpData)

          if (!itpData || itpData.length === 0) {
            console.warn('⚠️ CreateLotModal: No ITPs found for project:', projectId)
            toast.error('No ITP templates found for this project')
            setItps([])
            return
          }

          const formattedItps = itpData.map(item => ({
            id: item.id,
            title: item.name,
            description: item.description || '',
          }))
          
          console.log('✅ CreateLotModal: Formatted ITPs:', formattedItps)
          setItps(formattedItps)
          toast.success(`Loaded ${formattedItps.length} ITP templates`)
          
        } catch (error) {
          console.error('💥 CreateLotModal: Error fetching ITPs:', error)
          toast.error('Failed to load ITP templates')
          setItps([])
        } finally {
          setIsLoadingItps(false)
        }
      }

      fetchItps()
    }
  }, [open, projectId])

  const onSubmit = async (values: LotFormValues) => {
    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('lotNumber', values.lotNumber)
        formData.append('description', values.description)
        formData.append('itpId', values.itpId)
        formData.append('projectId', values.projectId)

        await createLotAction(formData)
        
        toast.success('Lot created successfully!')
        form.reset()
        onOpenChange(false)
      } catch (error) {
        console.error('Error creating lot:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to create lot')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Lot</DialogTitle>
          <DialogDescription>
            Add a new inspection lot to this project. Choose an ITP template to define the inspection checklist.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lotNumber">Lot Number</Label>
            <Input
              id="lotNumber"
              {...form.register('lotNumber')}
              placeholder="e.g., LOT-001"
              disabled={isPending}
            />
            {form.formState.errors.lotNumber && (
              <p className="text-sm text-destructive">{form.formState.errors.lotNumber.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Describe what this lot covers..."
              disabled={isPending}
              rows={3}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="itpId">ITP Template</Label>
            <Select
              value={form.watch('itpId')}
              onValueChange={(value: string) => form.setValue('itpId', value)}
              disabled={isPending || isLoadingItps}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  isLoadingItps
                    ? "Loading ITP templates..."
                    : itps.length === 0
                      ? "No ITP templates available"
                      : "Select an ITP template"
                } />
              </SelectTrigger>
              <SelectContent>
                {itps.length > 0 ? (
                  itps.map((itp) => (
                    <SelectItem key={itp.id} value={itp.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{itp.title}</span>
                        {itp.description && (
                          <span className="text-sm text-muted-foreground">{itp.description}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-itps" disabled>
                    {isLoadingItps ? "Loading..." : "No ITP templates found"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.itpId && (
              <p className="text-sm text-destructive">{form.formState.errors.itpId.message}</p>
            )}
            {itps.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Found {itps.length} ITP template{itps.length !== 1 ? 's' : ''} for this project
              </p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Lot'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}