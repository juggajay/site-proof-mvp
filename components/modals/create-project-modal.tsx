'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { createClient } from '../../lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

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
  const [isCreating, setIsCreating] = useState(false)
  const router = useRouter()

  // Create Supabase client with modern approach
  const supabase = createClient()

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
  })

  const onSubmit = async (data: CreateProjectForm) => {
    console.log('🎯 Form submitted with data:', data)
    setIsCreating(true)

    try {
      // Check authentication
      console.log('🔐 Checking authentication...')
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        throw new Error('Authentication failed')
      }
      
      if (!session) {
        console.error('❌ No session found')
        throw new Error('Please sign in to create a project')
      }

      console.log('✅ User authenticated:', session.user.id)

      // Get user profile
      console.log('👤 Getting user profile...')
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', session.user.id)
        .single()
      
      if (profileError) {
        console.error('❌ Profile error:', profileError)
        throw new Error('User profile not found. Please contact support.')
      }
      
      if (!profile?.organization_id) {
        console.error('❌ No organization_id found in profile:', profile)
        throw new Error('User not assigned to an organization')
      }

      console.log('✅ Profile found with organization_id:', profile.organization_id)

      // Create project
      console.log('🏗️ Creating project...')
      console.log('Project data to insert:', {
        name: data.name,
        location: data.location,
        organization_id: profile.organization_id,
      })
      
      const { data: project, error: createError } = await supabase
        .from('projects')
        .insert([
          {
            name: data.name,
            location: data.location,
            organization_id: profile.organization_id,
          }
        ])
        .select()
        .single()

      if (createError) {
        console.error('❌ Create error:', createError)
        throw new Error(`Failed to create project: ${createError.message}`)
      }

      console.log('✅ Project created successfully:', project)
      
      // Success
      toast.success('Project created successfully!')
      form.reset()
      onOpenChange(false)
      
      // Navigate to new project or refresh
      router.push(`/project/${project.id}`)
      router.refresh()

    } catch (error) {
      console.error('❌ Create project error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project'
      toast.error(errorMessage)
    } finally {
      setIsCreating(false)
    }
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
            <Input id="name" {...form.register('name')} disabled={isCreating} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input id="projectNumber" {...form.register('projectNumber')} disabled={isCreating} />
            {form.formState.errors.projectNumber && <p className="text-sm text-destructive">{form.formState.errors.projectNumber.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" {...form.register('location')} disabled={isCreating} />
            {form.formState.errors.location && <p className="text-sm text-destructive">{form.formState.errors.location.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>Cancel</Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <>
                  <svg className="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}