'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './lib/supabase/server'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(2),
  projectNumber: z.string().min(1),
  location: z.string().min(2),
})

export async function createProjectAction(formData: FormData) {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Authentication required')

  // We need the user's organization_id from the profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) throw new Error('User profile not found')

  const validatedData = projectSchema.safeParse({
    name: formData.get('name'),
    projectNumber: formData.get('projectNumber'),
    location: formData.get('location'),
  })

  if (!validatedData.success) {
    throw new Error('Invalid form data')
  }

  const { error } = await supabase.from('projects').insert({
    name: validatedData.data.name,
    project_number: validatedData.data.projectNumber,
    location: validatedData.data.location,
    organization_id: profile.organization_id,
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/dashboard')
}