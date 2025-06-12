'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from './lib/supabase/server'
import { z } from 'zod'

const projectSchema = z.object({
  name: z.string().min(2, { message: 'Project name must be at least 2 characters.' }),
  projectNumber: z.string().min(1, { message: 'Project number is required.' }),
  location: z.string().min(2, { message: 'Location must be at least 2 characters.' }),
})

const lotSchema = z.object({
  lotNumber: z.string().min(1, { message: 'Lot number is required.' }),
  description: z.string().min(2, { message: 'Description must be at least 2 characters.' }),
  itpId: z.string().uuid({ message: 'Please select a valid ITP template.' }),
  projectId: z.string().uuid({ message: 'Invalid project ID.' }),
})

export async function createProjectAction(formData: FormData) {
  console.log('Server Action: createProjectAction initiated.')
  const supabase = createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('Server Action Error: Authentication required.')
    throw new Error('Authentication failed. Please log in again.')
  }
  console.log('Authenticated user:', user.id)

  // 2. Get User's Profile to find their Organization ID
  // This is a common point of failure. We will add detailed error handling.
  let organizationId: string | null = null
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError.message)
        throw new Error(`Could not find a user profile. DB error: ${profileError.message}`)
    }
    if (!profile) {
        console.error('No profile found for user:', user.id)
        throw new Error('User profile not found. Please contact support.')
    }
    if (!profile.organization_id) {
        console.error('Profile for user', user.id, 'is missing an organization_id.')
        throw new Error('Your user profile is not linked to an organization. Please contact support.')
    }
    
    organizationId = profile.organization_id
    console.log('Found organization ID:', organizationId)

  } catch (e) {
    // Re-throw the specific error for better debugging
    if (e instanceof Error) {
        throw e
    }
    throw new Error('An unexpected error occurred while fetching your profile.')
  }

  // 3. Validate Form Data
  const validatedData = projectSchema.safeParse({
    name: formData.get('name'),
    projectNumber: formData.get('projectNumber'),
    location: formData.get('location'),
  })

  if (!validatedData.success) {
    console.error('Server Action Error: Invalid form data.', validatedData.error.flatten())
    // Join all error messages into a single string
    const errorMessages = validatedData.error.errors.map(err => err.message).join(' ')
    throw new Error(`Invalid data: ${errorMessages}`)
  }
  console.log('Form data validated successfully:', validatedData.data)

  // 4. Insert the new project into the database
  const { error: insertError } = await supabase.from('projects').insert({
    name: validatedData.data.name,
    project_number: validatedData.data.projectNumber,
    location: validatedData.data.location,
    organization_id: organizationId,
  })

  if (insertError) {
    console.error('Server Action Error: Database insert failed.', insertError.message)
    throw new Error(`Failed to create project in the database. Reason: ${insertError.message}`)
  }

  console.log('Project created successfully in database.')

  // 5. Revalidate the path to update the UI
  revalidatePath('/dashboard')

  console.log('Server Action: createProjectAction completed successfully.')
  return { success: true }
}

export async function createLotAction(formData: FormData) {
  console.log('Server Action: createLotAction initiated.')
  const supabase = createClient()

  // 1. Get User
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.error('Server Action Error: Authentication required.')
    throw new Error('Authentication failed. Please log in again.')
  }
  console.log('Authenticated user:', user.id)

  // 2. Validate Form Data
  const validatedData = lotSchema.safeParse({
    lotNumber: formData.get('lotNumber'),
    description: formData.get('description'),
    itpId: formData.get('itpId'),
    projectId: formData.get('projectId'),
  })

  if (!validatedData.success) {
    console.error('Server Action Error: Invalid form data.', validatedData.error.flatten())
    const errorMessages = validatedData.error.errors.map(err => err.message).join(' ')
    throw new Error(`Invalid data: ${errorMessages}`)
  }
  console.log('Form data validated successfully:', validatedData.data)

  // 3. Insert the new lot into the database
  const { error: insertError } = await supabase.from('lots').insert({
    lot_number: validatedData.data.lotNumber,
    description: validatedData.data.description,
    itp_id: validatedData.data.itpId,
    project_id: validatedData.data.projectId,
    status: 'IN_PROGRESS',
  })

  if (insertError) {
    console.error('Server Action Error: Database insert failed.', insertError.message)
    throw new Error(`Database Error: Could not create lot. ${insertError.message}`)
  }

  console.log('Lot created successfully in database.')

  // 4. Revalidate the path to update the UI
  revalidatePath(`/project/${validatedData.data.projectId}`)

  console.log('Server Action: createLotAction completed successfully.')
  return { success: true }
}