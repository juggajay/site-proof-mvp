'use client'

import { useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createProjectAction } from '@/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const createProjectSchema = z.object({
  name: z.string().min(2, { message: 'Project name must be at least 2 characters.' }),
  projectNumber: z.string().min(1, { message: 'Project number is required.' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
})

type CreateProjectForm = z.infer<typeof createProjectSchema>

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectModal({ open, onOpenChange }: CreateProjectModalProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  })

  const onSubmit = (data: CreateProjectForm) => {
    startTransition(async () => {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('projectNumber', data.projectNumber)
      formData.append('location', data.location)

      try {
        await createProjectAction(formData)
        toast.success('Project created successfully!')
        form.reset()
        onOpenChange(false)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'An unknown error occurred.')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to your organization. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input id="name" {...form.register('name')} disabled={isPending} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input id="projectNumber" {...form.register('projectNumber')} disabled={isPending} />
            {form.formState.errors.projectNumber && <p className="text-sm text-destructive">{form.formState.errors.projectNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...form.register('location')} disabled={isPending} />
            {form.formState.errors.location && <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Creating...' : 'Create Project'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}