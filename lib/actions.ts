'use server'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { 
  User, Profile, Organization, Project, Lot, ITPTemplate, ITPItem, ITPTemplateItem,
  ConformanceRecord, Attachment, InspectionReport, NonConformance,
  ProjectWithDetails, LotWithDetails, ITPTemplateWithItems,
  CreateProjectRequest, CreateLotRequest, CreateITPTemplateRequest,
  UpdateConformanceRequest, APIResponse, ProjectStats, InspectionSummary,
  DailyReport, DailyEvent, DailyLabour, DailyPlant, DailyMaterials,
  CreateDailyReportRequest, CreateDailyEventRequest, CreateDailyLabourRequest,
  CreateDailyPlantRequest, CreateDailyMaterialsRequest,
  ITP, ITPWithDetails, ITPAssignment, CreateITPFromTemplateRequest,
  CreateITPAssignmentRequest, UpdateITPItemRequest, VITPOverview
} from '@/types/database'

// Import shared mock database storage
import { 
  mockUsers, mockProfiles, mockOrganizations, mockProjects, mockLots,
  mockLotITPTemplates, mockITPTemplates, mockITPItems, mockConformanceRecords, 
  mockAttachments, mockReports, mockNonConformances, mockDailyReports, 
  mockDailyEvents, mockDailyLabour, mockDailyPlant, mockDailyMaterials
} from './mock-data'

// Import database abstraction layer
import { createProject, getProjects, getProjectById } from './database'
import { isSupabaseEnabled, supabase } from './supabase'

// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

function generateToken(userId: number): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number }
  } catch {
    return null
  }
}

// Authentication helper functions
async function findUserByEmail(email: string) {
  return mockUsers.find(user => user.email === email) || null
}

async function findUserById(id: number) {
  const user = mockUsers.find(u => u.id === id)
  if (!user) return null

  const profile = mockProfiles.find(p => p.user_id === id)
  
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.email_verified,
    profile: profile ? {
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      avatarUrl: profile.avatar_url,
      phone: profile.phone,
      timezone: profile.timezone
    } : undefined
  }
}

async function createUserInDb(email: string, passwordHash: string) {
  const newUser = {
    id: mockUsers.length + 1,
    email,
    password_hash: passwordHash,
    email_verified: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  mockUsers.push(newUser)
  return newUser
}

async function createProfileInDb(userId: number, firstName?: string, lastName?: string) {
  const newProfile: Profile = {
    id: mockProfiles.length + 1,
    user_id: userId,
    first_name: firstName,
    last_name: lastName,
    avatar_url: undefined,
    phone: undefined,
    timezone: 'UTC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  mockProfiles.push(newProfile)
  return newProfile
}

// ==================== AUTHENTICATION ACTIONS ====================

export async function signupAction(formData: FormData): Promise<APIResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const firstName = formData.get('firstName') as string || undefined
  const lastName = formData.get('lastName') as string || undefined

  // Validation
  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address' }
  }

  try {
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return { success: false, error: 'An account with this email already exists' }
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const newUser = await createUserInDb(email, passwordHash)

    // Always create profile (even with empty names)
    await createProfileInDb(newUser.id, firstName, lastName)

    // Create organization for new user
    const orgSlug = `org-${newUser.id}-${Date.now()}`
    const orgName = email.split('@')[0] + "'s Organization"
    
    const newOrg: Organization = {
      id: mockOrganizations.length + 1,
      name: orgName,
      slug: orgSlug,
      description: 'Default organization',
      created_by: newUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    mockOrganizations.push(newOrg)

    // Link user to organization as owner
    // Note: In mock data, we don't have a user_organizations table, 
    // but in real implementation this would be tracked

    const token = generateToken(newUser.id)
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true, message: 'Account created successfully' }
  } catch (error) {
    console.error('Signup error:', error)
    return { success: false, error: 'Failed to create account. Please try again.' }
  }
}

export async function loginAction(formData: FormData): Promise<APIResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required' }
  }

  try {
    const user = await findUserByEmail(email)
    if (!user) {
      return { success: false, error: 'Invalid email or password' }
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      return { success: false, error: 'Invalid email or password' }
    }

    const token = generateToken(user.id)
    cookies().set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { success: true, message: 'Login successful' }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed. Please try again.' }
  }
}

export async function logoutAction() {
  cookies().delete('auth-token')
  redirect('/auth/login')
}

export async function getCurrentUser() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    console.log('getCurrentUser: token exists:', !!token)
    
    if (!token) {
      console.log('getCurrentUser: No token found in cookies')
      return null
    }

    const payload = verifyToken(token)
    console.log('getCurrentUser: payload:', payload)
    if (!payload) {
      console.log('getCurrentUser: Invalid token payload')
      return null
    }

    const user = await findUserById(payload.userId)
    console.log('getCurrentUser: user found:', !!user, user ? user.email : 'no user')
    return user
  } catch (error) {
    console.error('getCurrentUser error:', error)
    return null
  }
}

export async function requireAuth() {
  console.error('requireAuth: Starting authentication check...')
  const user = await getCurrentUser()
  console.error('requireAuth: getCurrentUser result:', !!user, user ? user.email : 'no user')
  if (!user) {
    console.error('requireAuth: Authentication failed - throwing error')
    throw new Error('Authentication required')
  }
  console.error('requireAuth: Authentication successful for:', user.email)
  return user
}

// ==================== DEBUG ACTIONS ====================

export async function debugLotLookupAction(lotId: string): Promise<APIResponse<any>> {
  console.error('🚨 debugLotLookupAction CALLED with lotId:', lotId)
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      // Test different query approaches
      const results: any = {
        lotId,
        lotIdType: typeof lotId,
        queries: []
      }
      
      // Query 1: Direct query
      const { data: q1, error: e1 } = await supabase
        .from('lots')
        .select('id, lot_number')
        .eq('id', lotId)
        .single()
      results.queries.push({ method: 'direct', data: q1, error: e1?.message })
      
      // Query 2: String cast
      const { data: q2, error: e2 } = await supabase
        .from('lots')
        .select('id, lot_number')
        .eq('id', String(lotId))
        .single()
      results.queries.push({ method: 'string_cast', data: q2, error: e2?.message })
      
      // Query 3: Get all and filter
      const { data: allLots, error: e3 } = await supabase
        .from('lots')
        .select('id, lot_number')
        .limit(20)
      
      const manualFind = allLots?.find(l => String(l.id) === String(lotId))
      results.queries.push({ 
        method: 'manual_find', 
        found: !!manualFind,
        data: manualFind,
        allLotIds: allLots?.map(l => ({ id: l.id, type: typeof l.id }))
      })
      
      return { success: true, data: results }
    } else {
      return { success: false, error: 'Supabase not enabled' }
    }
  } catch (error) {
    console.error('🚨 Debug lot lookup error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export async function debugDatabaseAction(): Promise<APIResponse<any>> {
  console.error('🚨 debugDatabaseAction CALLED')
  try {
    console.error('🚨 About to call requireAuth in debug action...')
    const user = await requireAuth()
    console.error('🚨 Debug action auth successful for:', user.email)
    
    // Use the same database layer as other actions
    const projectsResult = await getProjects()
    const projects = projectsResult.success ? projectsResult.data! : []
    
    console.error('🚨 Debug action - projects in database:', projects.length)
    console.error('🚨 Debug action - project IDs:', projects.map(p => ({ id: p.id, name: p.name })))
    
    return { 
      success: true, 
      data: { 
        projectCount: projects.length,
        projects: projects.map(p => ({ id: p.id, name: p.name })),
        authUser: user.email,
        usingSupabase: isSupabaseEnabled
      } 
    }
  } catch (error) {
    console.error('🚨 Debug action error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// ==================== PROJECT ACTIONS ====================

export async function createProjectAction(formData: FormData): Promise<APIResponse<Project>> {
  try {
    console.log('createProjectAction called')
    const user = await requireAuth()
    console.log('User authenticated:', user)
    
    if (!user) {
      return { success: false, error: 'Please log in to create a project' }
    }
    
    const name = formData.get('name') as string
    const projectNumber = formData.get('projectNumber') as string
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const startDate = formData.get('startDate') as string
    const endDate = formData.get('endDate') as string

    console.log('Form data:', { name, projectNumber, description, location, startDate, endDate })

    if (!name) {
      return { success: false, error: 'Project name is required' }
    }

    // Create project using database abstraction layer
    // Only include fields that exist in the projects table
    const projectData = {
      name,
      description: description || undefined,
      location: location || undefined,
      organization_id: '550e8400-e29b-41d4-a716-446655440001' // Default organization
      // These fields don't exist in the projects table:
      // project_number, start_date, end_date, status
    }
    
    console.log('🚀 createProjectAction: Calling createProject with data:', JSON.stringify(projectData, null, 2))
    const result = await createProject(projectData)
    
    if (result.success) {
      console.log('=== PROJECT CREATION SUCCESS ===')
      console.log('createProjectAction: Created new project with ID:', result.data!.id)
      revalidatePath('/dashboard')
      revalidatePath('/projects')
    } else {
      console.error('=== PROJECT CREATION FAILED ===')
      console.error('Error:', result.error)
      
      // Add more specific error messages
      if (result.error?.includes('end_date') || result.error?.includes('schema cache')) {
        result.error = 'Database schema issue detected. Please try again or contact support if the issue persists.'
      }
    }
    
    return result
  } catch (error) {
    console.error('Create project error:', error)
    
    if (error instanceof Error) {
      if (error.message === 'Authentication required') {
        return { success: false, error: 'Please log in to create a project' }
      }
      return { success: false, error: error.message }
    }
    
    return { success: false, error: 'Failed to create project' }
  }
}

export async function getProjectsAction(): Promise<APIResponse<Project[]>> {
  try {
    console.error('🚨 getProjectsAction: Starting...')
    await requireAuth()
    console.error('🚨 getProjectsAction: Auth successful')
    
    // Use database abstraction layer
    const result = await getProjects()
    
    if (result.success) {
      console.error('🚨 getProjectsAction: Total projects available:', result.data!.length)
      console.error('🚨 getProjectsAction: Project IDs:', result.data!.map(p => ({ id: p.id, type: typeof p.id, name: p.name })))
    }
    
    return result
  } catch (error) {
    return { success: false, error: 'Failed to fetch projects' }
  }
}

// Helper function to normalize IDs for comparison
function normalizeId(id: number | string): string {
  return String(id)
}

// Helper function to compareIds regardless of type
function compareIds(id1: number | string, id2: number | string): boolean {
  return normalizeId(id1) === normalizeId(id2)
}

export async function getProjectByIdAction(projectId: number | string): Promise<APIResponse<ProjectWithDetails>> {
  console.error('🚨 getProjectByIdAction CALLED with projectId:', projectId)
  try {
    console.error('🚨 About to call requireAuth...')
    await requireAuth()
    console.error('🚨 requireAuth completed successfully')
    
    // Use database abstraction layer
    const result = await getProjectById(projectId)
    
    console.error('🚨 getProjectByIdAction: Database result:', result.success ? 'SUCCESS' : 'FAILED')
    if (result.success) {
      console.error('🚨 getProjectByIdAction: Found project:', result.data!.name)
    } else {
      console.error('🚨 getProjectByIdAction: Error:', result.error)
    }

    return result
  } catch (error) {
    console.error('🚨 getProjectByIdAction CAUGHT ERROR:', error)
    console.error('🚨 Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('🚨 Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    
    if (error instanceof Error && error.message === 'Authentication required') {
      return { success: false, error: 'Authentication required' }
    }
    
    return { success: false, error: 'Failed to fetch project' }
  }
}

export async function updateProjectAction(projectId: number, formData: FormData): Promise<APIResponse<Project>> {
  try {
    await requireAuth()
    
    const projectIndex = mockProjects.findIndex(p => p.id === projectId)
    if (projectIndex === -1) {
      return { success: false, error: 'Project not found' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const location = formData.get('location') as string
    const status = formData.get('status') as Project['status']

    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      name: name || mockProjects[projectIndex].name,
      description: description || mockProjects[projectIndex].description,
      location: location || mockProjects[projectIndex].location,
      status: status || mockProjects[projectIndex].status,
      updated_at: new Date().toISOString()
    }

    revalidatePath(`/project/${projectId}`)
    return { success: true, data: mockProjects[projectIndex] }
  } catch (error) {
    return { success: false, error: 'Failed to update project' }
  }
}

// ==================== LOT ACTIONS ====================

export async function createLotAction(formData: FormData): Promise<APIResponse<Lot>> {
  try {
    const user = await requireAuth()
    
    const projectId = formData.get('projectId') as string
    const lotNumber = formData.get('lotNumber') as string
    const description = formData.get('description') as string
    const locationDescription = formData.get('locationDescription') as string

    if (!projectId || !lotNumber) {
      return { success: false, error: 'Project ID and lot number are required' }
    }

    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating lot in Supabase...')
      console.log('📊 Project ID:', projectId, 'Type:', typeof projectId)
      console.log('📊 Lot Number:', lotNumber)
      
      // Check if lot number already exists
      const { data: existingLot } = await supabase
        .from('lots')
        .select('id')
        .eq('project_id', projectId)
        .eq('lot_number', lotNumber)
        .single()
      
      if (existingLot) {
        return { success: false, error: 'Lot number already exists in this project' }
      }
      
      const { data: newLot, error } = await supabase
        .from('lots')
        .insert({
          project_id: projectId,
          lot_number: lotNumber,
          description: description || locationDescription || null,
          status: 'IN_PROGRESS',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Lot created in Supabase:', newLot)
      revalidatePath(`/project/${projectId}`)
      return { success: true, data: newLot, message: 'Lot created successfully' }
    } else {
      console.log('📝 Creating lot in mock data...')
      // Check if lot number already exists in project
      const existingLot = mockLots.find(l => compareIds(l.project_id, projectId) && l.lot_number === lotNumber)
      if (existingLot) {
        return { success: false, error: 'Lot number already exists in this project' }
      }

      // Generate new numeric ID for lot
      const numericLotIds = mockLots.map(l => typeof l.id === 'number' ? l.id : 0)
      const newLot: Lot = {
        id: Math.max(0, ...numericLotIds) + 1,
        project_id: projectId,
        lot_number: lotNumber,
        description: description || undefined,
        location_description: locationDescription || undefined,
        status: 'pending',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockLots.push(newLot)
      revalidatePath(`/project/${projectId}`)
      
      return { success: true, data: newLot, message: 'Lot created successfully' }
    }
  } catch (error) {
    console.error('Create lot error:', error)
    return { success: false, error: 'Failed to create lot' }
  }
}

export async function assignITPToLotAction(lotId: number | string, itpTemplateId: number | string): Promise<APIResponse<Lot>> {
  try {
    const user = await requireAuth()
    
    console.log('assignITPToLotAction: Assigning template', itpTemplateId, 'to lot', lotId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Assigning ITP in Supabase...')
      
      // First check if lot exists
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .eq('id', lotId)
        .single()
      
      if (lotError || !lot) {
        console.log('Lot not found:', lotError)
        return { success: false, error: 'Lot not found' }
      }
      
      // Check if ITP exists in the itps table (which the foreign key constraint references)
      const { data: itp, error: itpError } = await supabase
        .from('itps')
        .select('*')
        .eq('id', itpTemplateId)
        .single()
      
      if (itpError || !itp) {
        console.log('ITP not found in itps table:', itpError)
        // Try to check itp_templates as fallback and provide better error message
        const { data: templateItp } = await supabase
          .from('itp_templates')
          .select('*')
          .eq('id', itpTemplateId)
          .single()
        
        if (templateItp) {
          return { success: false, error: `ITP template exists but is not synced to itps table. Please sync data first.` }
        }
        
        return { success: false, error: `ITP template not found: ${itpTemplateId}` }
      }
      
      console.log('Found ITP:', { id: itp.id, name: itp.name })
      
      // Update the lot with the ITP ID (no junction table exists)
      console.log('Updating lot with ITP assignment...')
      const { data: updatedLot, error: updateError } = await supabase
        .from('lots')
        .update({
          itp_id: itpTemplateId,
          updated_at: new Date().toISOString()
        })
        .eq('id', lotId)
        .select()
        .single()
      
      if (updateError) {
        console.error('Failed to update lot:', updateError)
        return { success: false, error: `Failed to assign ITP: ${updateError.message}` }
      }
      
      // Update lot status if needed
      if (lot.status === 'pending') {
        await supabase
          .from('lots')
          .update({
            status: 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', lotId)
      }
      
      console.log('✅ ITP assigned in Supabase:', updatedLot)
      revalidatePath(`/project/${lot.project_id}`)
      return { success: true, data: updatedLot, message: 'ITP assigned successfully' }
    } else {
      console.log('📝 Assigning ITP in mock data...')
      const lot = mockLots.find(l => compareIds(l.id, lotId))
      if (!lot) {
        console.log('assignITPToLotAction: Lot not found for ID:', lotId)
        return { success: false, error: 'Lot not found' }
      }

      const itpTemplate = mockITPTemplates.find(t => compareIds(t.id, itpTemplateId))
      if (!itpTemplate) {
        console.log('assignITPToLotAction: ITP template not found for ID:', itpTemplateId)
        console.log('assignITPToLotAction: Available templates:', mockITPTemplates.map(t => ({ id: t.id, name: t.name })))
        return { success: false, error: 'ITP template not found' }
      }
      
      // Check if already assigned
      const existingAssignment = mockLotITPTemplates.find(lit => 
        compareIds(lit.lot_id, lotId) && compareIds(lit.itp_template_id, itpTemplateId)
      )
      
      if (existingAssignment) {
        if (!existingAssignment.is_active) {
          existingAssignment.is_active = true
          existingAssignment.updated_at = new Date().toISOString()
        }
        return { success: true, data: lot, message: 'ITP template already assigned' }
      }
      
      // Add new assignment to junction table
      const newAssignment = {
        id: mockLotITPTemplates.length + 1,
        lot_id: lotId,
        itp_template_id: itpTemplateId,
        assigned_by: user.id,
        is_active: true,
        assigned_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      mockLotITPTemplates.push(newAssignment)
      
      // Update lot status if needed
      if (lot.status === 'pending') {
        const lotIndex = mockLots.findIndex(l => compareIds(l.id, lotId))
        mockLots[lotIndex] = {
          ...lot,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        }
      }
      
      console.log('assignITPToLotAction: Successfully assigned ITP template to lot')
      revalidatePath(`/project/${lot.project_id}`)
      return { success: true, data: lot, message: 'ITP assigned successfully' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to assign ITP' }
  }
}

export async function removeITPFromLotAction(lotId: number | string, itpTemplateId: number | string): Promise<APIResponse<void>> {
  try {
    await requireAuth()
    
    console.log('removeITPFromLotAction: Removing template', itpTemplateId, 'from lot', lotId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Removing ITP in Supabase...')
      
      // Deactivate the ITP assignment (soft delete)
      const { error } = await supabase
        .from('lot_itp_templates')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('lot_id', lotId)
        .eq('itp_template_id', itpTemplateId)
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ ITP removed from lot in Supabase')
      revalidatePath(`/project/*/lot/${lotId}`)
      return { success: true, message: 'ITP removed successfully' }
    } else {
      console.log('📝 Removing ITP in mock data...')
      
      const assignment = mockLotITPTemplates.find(lit => 
        compareIds(lit.lot_id, lotId) && compareIds(lit.itp_template_id, itpTemplateId) && lit.is_active
      )
      
      if (!assignment) {
        return { success: false, error: 'ITP assignment not found' }
      }
      
      // Soft delete by marking as inactive
      assignment.is_active = false
      assignment.updated_at = new Date().toISOString()
      
      console.log('removeITPFromLotAction: Successfully removed ITP template from lot')
      revalidatePath(`/project/*/lot/${lotId}`)
      return { success: true, message: 'ITP removed successfully' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to remove ITP' }
  }
}

export async function getLotByIdAction(lotId: number | string): Promise<APIResponse<LotWithDetails>> {
  try {
    await requireAuth()
    
    console.error('🚨 SERVER: getLotByIdAction - Looking for lot with ID:', lotId, 'Type:', typeof lotId)
    console.log('🔍 getLotByIdAction called with:', { lotId, type: typeof lotId })
    console.log('🔍 Supabase enabled:', isSupabaseEnabled)
    console.log('🔍 Supabase client exists:', !!supabase)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching lot from Supabase...')
      console.log('📊 Lot ID to search:', lotId, 'Type:', typeof lotId)
      
      // First, let's check if the lot exists with a simple query
      let { data: lotExists, error: checkError } = await supabase
        .from('lots')
        .select('id, lot_number, project_id')
        .eq('id', lotId)
        .single()
      
      console.log('📊 Lot existence check:', { lotExists, checkError })
      
      if (checkError) {
        console.log('📊 Initial query failed, trying alternative approaches...')
        
        // Try with explicit UUID casting
        const { data: lotExists2, error: checkError2 } = await supabase
          .from('lots')
          .select('id, lot_number, project_id')
          .eq('id', String(lotId))
          .single()
        
        console.log('📊 String cast result:', { lotExists2, checkError2 })
        
        if (!checkError2 && lotExists2) {
          // Success with string cast, continue with this approach
          lotExists = lotExists2
        } else {
          // Let's get all lots to debug
          const { data: allLots, error: allLotsError } = await supabase
            .from('lots')
            .select('id, lot_number, project_id')
            .limit(10)
          
          console.log('📊 All lots for debugging:', allLots)
          console.log('📊 Looking for ID:', lotId, 'in', allLots?.map(l => ({ id: l.id, type: typeof l.id })))
          
          // Try to find the lot manually
          const foundLot = allLots?.find(l => String(l.id) === String(lotId))
          if (foundLot) {
            console.log('📊 Found lot manually:', foundLot)
            lotExists = foundLot
          } else {
            return { success: false, error: `Lot not found. ID: ${lotId}` }
          }
        }
      }
      
      // Get lot with project details
      // Use the same ID approach that worked in the existence check
      const lotIdToUse = lotExists ? lotExists.id : String(lotId)
      console.log('📊 Using lot ID for full query:', lotIdToUse, 'Type:', typeof lotIdToUse)
      
      let lot: any
      const { data: lotData, error: lotError } = await supabase
        .from('lots')
        .select(`
          *,
          project:projects(*)
        `)
        .eq('id', lotIdToUse)
        .single()
      
      lot = lotData
      
      if (lotError || !lot) {
        console.error('Lot not found in full query:', lotError)
        // Try without the joins as a fallback
        const { data: simpleLot, error: simpleError } = await supabase
          .from('lots')
          .select('*')
          .eq('id', lotIdToUse)
          .single()
        
        if (simpleError || !simpleLot) {
          console.error('Simple lot query also failed:', simpleError)
          return { success: false, error: 'Lot not found' }
        }
        
        // Manually fetch related data
        console.log('📊 Fetching related data separately...')
        const projectResult = simpleLot.project_id ? await supabase
          .from('projects')
          .select('*')
          .eq('id', simpleLot.project_id)
          .single() : null
        
        // Check for itp_id field (actual database schema uses itp_id, not itp_template_id)
        const itpId = simpleLot.itp_id
        const itpResult = itpId ? await supabase
          .from('itps')
          .select('*')
          .eq('id', itpId)
          .single() : null
        
        lot = {
          ...simpleLot,
          project: projectResult?.data || null,
          itp: itpResult?.data || null
        }
      }
      
      // Get directly assigned ITP template (lots.itp_id)
      let itpTemplates: any[] = []
      const lotItpTemplates: any[] = [] // Empty since no junction table exists
      
      if (lot.itp_id) {
        const directItpId = lot.itp_id
        console.log('📊 No junction table templates found, checking direct assignment:', directItpId)
        
        // Fetch the directly assigned ITP from itps table
        const { data: directTemplate } = await supabase
          .from('itps')
          .select('*')
          .eq('id', directItpId)
          .single()
        
        if (directTemplate) {
          // Since itps table doesn't have items, fetch corresponding template from itp_templates
          const { data: templateForItems } = await supabase
            .from('itp_templates')
            .select('*')
            .eq('id', directItpId)
            .single()
          
          // Fetch items for this template (using itp_id column)
          console.log('📊 Fetching items for ITP ID:', directItpId)
          const { data: directItems } = await supabase
            .from('itp_items')
            .select('*')
            .eq('itp_id', directItpId)
            .order('sort_order')
          
          console.log('✅ Found items:', directItems?.length || 0, 'items')
          
          // Map items to expected format
          const mappedItems = (directItems || []).map(item => ({
            ...item,
            item_type: item.item_number?.toLowerCase() === 'pass_fail' ? 'pass_fail' : 
                      item.item_number?.toLowerCase() === 'numeric' ? 'numeric' : 
                      item.item_number?.toLowerCase() === 'text_input' ? 'text_input' : 'pass_fail',
            itp_template_id: item.itp_id, // Map itp_id to itp_template_id for interface compatibility
            order_index: item.sort_order, // Map sort_order to order_index
            item_number: `${item.sort_order}`, // Use sort_order as item number
            inspection_method: item.item_number // Store the type as inspection method
          }))
          
          const formattedTemplate = {
            id: directTemplate.id,
            name: directTemplate.name,
            description: directTemplate.description,
            category: directTemplate.category || 'general',
            version: templateForItems?.version || '1.0',
            is_active: templateForItems?.is_active ?? true,
            organization_id: directTemplate.organization_id,
            created_by: templateForItems?.created_by || 1,
            created_at: directTemplate.created_at,
            updated_at: directTemplate.updated_at,
            itp_items: mappedItems
          }
          
          itpTemplates.push(formattedTemplate)
          console.log('✅ Added directly assigned template:', directTemplate.name)
        }
      }
      
      // For backward compatibility, set the first template as itp_template
      const primaryTemplate = itpTemplates.length > 0 ? itpTemplates[0] : undefined
      
      // Get conformance records
      const { data: conformanceRecords } = await supabase
        .from('conformance_records')
        .select('*')
        .eq('lot_id', lotId)
      
      // Map to LotWithDetails format
      const lotWithDetails: LotWithDetails = {
        ...lot,
        project: lot.project,
        itp_template: primaryTemplate,  // Legacy support
        itp_templates: itpTemplates,     // New multiple templates
        lot_itp_templates: lotItpTemplates || [],
        conformance_records: conformanceRecords || []
      }
      
      console.log('✅ Fetched lot from Supabase with', itpTemplates.length, 'ITP templates')
      return { success: true, data: lotWithDetails }
    } else {
      console.log('📝 Fetching lot from mock data...')
      const lot = mockLots.find(l => compareIds(l.id, lotId))
      if (!lot) {
        console.log('getLotByIdAction: Lot not found for ID:', lotId)
        return { success: false, error: 'Lot not found' }
      }

      console.log('getLotByIdAction: Found lot:', lot.lot_number)
      const project = mockProjects.find(p => compareIds(p.id, lot.project_id))!
      
      // Get all assigned ITPs from junction table
      const lotItpTemplates = mockLotITPTemplates.filter(lit => 
        compareIds(lit.lot_id, lotId) && lit.is_active
      )
      
      // Fetch all ITP templates and their items
      const itpTemplates = lotItpTemplates.map(lit => {
        const template = mockITPTemplates.find(t => compareIds(t.id, lit.itp_template_id))
        if (!template) return null
        
        const items = mockITPItems.filter(i => compareIds((i as any).itp_template_id || i.template_item_id, template.id))
        return { ...template, itp_items: items }
      }).filter(Boolean)
      
      // For backward compatibility, use first template or single assignment
      let primaryTemplate = itpTemplates.length > 0 ? itpTemplates[0] : undefined
      if (!primaryTemplate && lot.itp_template_id) {
        // Fall back to legacy single ITP assignment
        const template = mockITPTemplates.find(t => compareIds(t.id, lot.itp_template_id!))
        if (template) {
          const items = mockITPItems.filter(i => compareIds((i as any).itp_template_id || i.template_item_id, template.id))
          primaryTemplate = { ...template, itp_items: items }
          itpTemplates.push(primaryTemplate)
        }
      }
      
      console.log('getLotByIdAction: Found', itpTemplates.length, 'ITP templates')
      console.log('getLotByIdAction: Templates:', itpTemplates.map(t => ({ id: t?.id, name: t?.name })))
      
      // Get all conformance records and find their associated items
      const conformanceRecords = mockConformanceRecords.filter(c => compareIds(c.lot_id, lotId))
      
      // Build a map of all ITP items from all templates
      const allItpItems = itpTemplates.reduce((acc, template) => {
        if (template && template.itp_items) {
          template.itp_items.forEach(item => {
            acc[item.id] = item
          })
        }
        return acc
      }, {} as Record<string | number, ITPItem>)

      const lotWithDetails: LotWithDetails = {
        ...lot,
        project,
        itp_template: primaryTemplate || undefined,  // Legacy support
        itp_templates: itpTemplates.filter((t): t is NonNullable<typeof t> => t !== null),     // New multiple templates
        lot_itp_templates: lotItpTemplates,
        assigned_inspector: lot.assigned_inspector_id ? mockProfiles.find(p => p.user_id === lot.assigned_inspector_id) : undefined,
        conformance_records: conformanceRecords.map(record => ({
          ...record,
          itp_item: allItpItems[record.itp_item_id]!,
          attachments: mockAttachments.filter(a => a.conformance_record_id === record.id)
        }))
      }

      return { success: true, data: lotWithDetails }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch lot details' }
  }
}

// ==================== ITP TEMPLATE ACTIONS ====================

export async function getITPTemplatesAction(): Promise<APIResponse<ITPTemplate[]>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching ITP templates from Supabase...')
      const { data: itps, error } = await supabase
        .from('itp_templates')
        .select('*')
        .order('name')
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      // Map itps to match ITPTemplate interface
      const templates = itps?.map(itp => ({
        id: itp.id,
        name: itp.name,
        description: itp.description,
        category: itp.category || 'general',
        version: '1.0',
        is_active: true,
        organization_id: itp.organization_id,
        created_by: 1, // Default user ID
        created_at: itp.created_at,
        updated_at: itp.updated_at
      })) || []
      
      console.log('✅ Fetched ITPs from Supabase:', templates.length)
      return { success: true, data: templates }
    } else {
      console.log('📝 Fetching ITP templates from mock data...')
      return { success: true, data: mockITPTemplates }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch ITP templates' }
  }
}

export async function getITPTemplateWithItemsAction(templateId: number | string): Promise<APIResponse<ITPTemplateWithItems>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching ITP with items from Supabase...')
      
      // First get the ITP template
      const { data: itp, error: itpError } = await supabase
        .from('itp_templates')
        .select('*')
        .eq('id', templateId)
        .single()
      
      if (itpError || !itp) {
        console.error('Supabase error:', itpError)
        return { success: false, error: 'ITP not found' }
      }
      
      // Then get the template items
      const { data: items, error: itemsError } = await supabase
        .from('itp_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order')
      
      if (itemsError) {
        console.error('Error fetching items:', itemsError)
      }
      
      // Map template items to the expected format
      const mappedItems = (items || []).map(item => ({
        id: item.id,
        template_id: item.template_id,
        item_number: item.item_number || `${item.sort_order}`,
        description: item.description,
        specification_reference: item.specification_reference,
        inspection_method: item.inspection_method,
        acceptance_criteria: item.acceptance_criteria,
        is_mandatory: item.is_mandatory,
        sort_order: item.sort_order,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as ITPTemplateItem[]
      
      // Map to ITPTemplateWithItems format
      const template: ITPTemplateWithItems = {
        id: itp.id,
        name: itp.name,
        description: itp.description,
        category: itp.category || 'general',
        version: '1.0',
        is_active: true,
        organization_id: itp.organization_id,
        created_by: 1, // Default user ID
        created_at: itp.created_at,
        updated_at: itp.updated_at,
        template_items: mappedItems,
        organization: {
          id: itp.organization_id,
          name: 'Default Organization',
          slug: 'default',
          created_by: 1, // Default user ID
          created_at: itp.created_at,
          updated_at: itp.updated_at
        }
      }
      
      console.log('✅ Fetched ITP from Supabase with', items?.length || 0, 'items')
      return { success: true, data: template }
    } else {
      console.log('📝 Fetching ITP template from mock data...')
      const template = mockITPTemplates.find(t => compareIds(t.id, templateId))
      if (!template) {
        return { success: false, error: 'ITP template not found' }
      }
      
      const items = mockITPItems.filter(item => compareIds((item as any).itp_template_id || item.template_item_id, templateId))
      
      // Convert ITPItems to ITPTemplateItems format for mock data
      const templateItems = items.map(item => ({
        id: item.id,
        template_id: templateId,
        item_number: item.item_number,
        description: item.description,
        specification_reference: item.specification_reference,
        inspection_method: item.inspection_method,
        acceptance_criteria: item.acceptance_criteria,
        is_mandatory: item.is_mandatory,
        sort_order: item.sort_order,
        created_at: item.created_at,
        updated_at: item.updated_at
      })) as ITPTemplateItem[]
      
      // Get the organization for this template
      const organization = mockOrganizations.find(o => o.id === template.organization_id)
      if (!organization) {
        return { success: false, error: 'Organization not found for this template' }
      }
      
      const templateWithItems: ITPTemplateWithItems = {
        ...template,
        template_items: templateItems,
        organization
      }
      
      return { success: true, data: templateWithItems }
    }
  } catch (error) {
    console.error('Get ITP template with items error:', error)
    return { success: false, error: 'Failed to fetch ITP template with items' }
  }
}

export async function createITPTemplateAction(data: CreateITPTemplateRequest): Promise<APIResponse<ITPTemplate>> {
  try {
    const user = await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating ITP template in Supabase...')
      
      // Insert into itp_templates table
      const { data: newItp, error } = await supabase
        .from('itp_templates')
        .insert({
          name: data.name,
          description: data.description || null,
          category: data.category || 'General',
          organization_id: '550e8400-e29b-41d4-a716-446655440001', // Default org
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      // Create template items if provided
      if (data.template_items && data.template_items.length > 0) {
        const itemsToInsert = data.template_items.map((item, index) => ({
          template_id: newItp.id,
          item_number: item.item_number || `ITEM-${index + 1}`,
          description: item.description,
          inspection_method: item.inspection_method || null,
          acceptance_criteria: item.acceptance_criteria || null,
          is_mandatory: item.is_mandatory ?? true,
          sort_order: item.sort_order || index + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))
        
        const { error: itemsError } = await supabase
          .from('itp_template_items')
          .insert(itemsToInsert)
        
        if (itemsError) {
          console.error('Failed to create ITP items:', itemsError)
          // Don't fail the whole operation if items fail
        }
      }
      
      // Return as ITPTemplate format
      const template: ITPTemplate = {
        id: newItp.id,
        name: newItp.name,
        description: newItp.description,
        category: newItp.category || 'general',
        version: '1.0',
        is_active: true,
        organization_id: newItp.organization_id,
        created_by: 1,
        created_at: newItp.created_at,
        updated_at: newItp.updated_at
      }
      
      console.log('✅ Created ITP template in Supabase:', template.id)
      return { success: true, data: template }
    } else {
      // Fallback to mock
      const newTemplate: ITPTemplate = {
        id: mockITPTemplates.length + 1,
        name: data.name,
        description: data.description,
        category: data.category,
        version: '1.0',
        is_active: true,
        organization_id: 1,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockITPTemplates.push(newTemplate)

      // Create ITP items
      data.itp_items.forEach((itemData, index) => {
        const newItem: ITPItem = {
          id: mockITPItems.length + 1,
          itp_template_id: newTemplate.id,
          item_number: itemData.item_number,
          description: itemData.description,
          specification_reference: itemData.specification_reference,
          inspection_method: itemData.inspection_method as any,
          acceptance_criteria: itemData.acceptance_criteria,
          item_type: itemData.item_type,
          is_mandatory: itemData.is_mandatory ?? true,
          order_index: itemData.order_index ?? index,
          created_at: new Date().toISOString()
        }
        mockITPItems.push(newItem)
      })

      return { success: true, data: newTemplate, message: 'ITP template created successfully' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to create ITP template' }
  }
}

// ==================== CONFORMANCE RECORD ACTIONS ====================

export async function saveConformanceRecordAction(
  lotId: number | string, 
  itpItemId: number | string, 
  data: UpdateConformanceRequest
): Promise<APIResponse<ConformanceRecord>> {
  console.log('🚀 saveConformanceRecordAction called with:', {
    lotId,
    itpItemId,
    data,
    timestamp: new Date().toISOString()
  })
  
  try {
    const user = await requireAuth()
    
    console.log('saveConformanceRecordAction: User authenticated:', user.email)
    
    // Check if we're working with mock data (numeric IDs)
    const isNumericLotId = typeof lotId === 'number' || (!isNaN(Number(lotId)) && Number(lotId) < 1000)
    const isNumericItemId = typeof itpItemId === 'number' || (!isNaN(Number(itpItemId)) && Number(itpItemId) < 1000)
    const isMockData = isNumericLotId || isNumericItemId
    
    console.log('📊 ID type detection:', {
      lotId,
      itpItemId,
      isNumericLotId,
      isNumericItemId,
      isMockData
    })
    
    // Try to detect if this lot exists in Supabase first
    let shouldUseMockData = isMockData
    if (isSupabaseEnabled && supabase && !isMockData) {
      // Check if this lot actually exists in Supabase
      const { data: lotCheck, error: lotCheckError } = await supabase
        .from('lots')
        .select('id')
        .eq('id', String(lotId))
        .single()
      
      if (lotCheckError || !lotCheck) {
        console.log('📊 Lot not found in Supabase, falling back to mock data')
        shouldUseMockData = true
      }
    }
    
    if (isSupabaseEnabled && supabase && !shouldUseMockData) {
      console.log('📊 Saving conformance record in Supabase...')
      
      // Convert numeric IDs to strings for Supabase (which uses UUIDs)
      const lotIdStr = String(lotId)
      const itpItemIdStr = String(itpItemId)
      
      console.log('📊 Checking for existing record with IDs:', { lotIdStr, itpItemIdStr })
      
      // Check if record exists
      const { data: existing, error: existingError } = await supabase
        .from('conformance_records')
        .select('id')
        .eq('lot_id', lotIdStr)
        .eq('itp_item_id', itpItemIdStr)
        .single()
      
      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing record:', existingError)
      }
      
      const recordData = {
        lot_id: lotIdStr,
        itp_item_id: itpItemIdStr,
        result: data.result_pass_fail || 'PASS',
        notes: data.comments || data.result_text || null,
        inspector_name: user.email || 'Inspector',
        inspection_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      let result;
      if (existing) {
        // Update existing record
        const { data: updated, error } = await supabase
          .from('conformance_records')
          .update(recordData)
          .eq('id', existing.id)
          .select()
          .single()
        
        if (error) {
          console.error('Supabase UPDATE error:', error)
          console.error('UPDATE failed with data:', recordData)
          return { success: false, error: `Update failed: ${error.message}` }
        }
        result = updated
      } else {
        // Insert new record
        const { data: inserted, error } = await supabase
          .from('conformance_records')
          .insert({
            ...recordData,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
        
        if (error) {
          console.error('Supabase INSERT error:', error)
          console.error('INSERT failed with data:', recordData)
          console.error('Error details:', { code: error.code, details: error.details, hint: error.hint })
          return { success: false, error: `Insert failed: ${error.message}` }
        }
        result = inserted
      }
      
      console.log('✅ Conformance record saved in Supabase')
      
      // Transform the result to match expected interface
      const transformedResult = {
        id: result.id,
        lot_id: result.lot_id,
        itp_item_id: result.itp_item_id,
        result_pass_fail: result.result || 'PASS',
        result_numeric: data.result_numeric,
        result_text: result.notes,
        comments: result.notes,
        is_non_conformance: result.result === 'FAIL',
        corrective_action: data.corrective_action,
        inspector_id: 1,
        inspection_date: result.inspection_date,
        created_at: result.created_at,
        updated_at: result.updated_at
      }
      
      revalidatePath(`/project/*/lot/${lotId}`)
      return { success: true, data: transformedResult, message: 'Inspection saved successfully' }
    } else {
      console.log('📝 Saving conformance record in mock data...')
      console.log('📝 Mock conformance records count:', mockConformanceRecords.length)
      console.log('📝 Looking for existing record with:', { lotId, itpItemId })
      
      // Ensure IDs are in the correct format for comparison
      const normalizedLotId = String(lotId)
      const normalizedItemId = Number(itpItemId)
      
      const existingIndex = mockConformanceRecords.findIndex(
        r => String(r.lot_id) === normalizedLotId && Number(r.itp_item_id) === normalizedItemId
      )
      
      console.log('📝 Existing record index:', existingIndex)

      const recordData: ConformanceRecord = {
        id: existingIndex >= 0 ? mockConformanceRecords[existingIndex].id : mockConformanceRecords.length + 1,
        lot_id: lotId,
        itp_item_id: itpItemId,
        result_pass_fail: data.result_pass_fail,
        result_numeric: data.result_numeric,
        result_text: data.result_text,
        comments: data.comments,
        is_non_conformance: data.result_pass_fail === 'FAIL',
        corrective_action: data.corrective_action,
        inspector_id: 1, // Mock user ID
        inspection_date: new Date().toISOString(),
        created_at: existingIndex >= 0 ? mockConformanceRecords[existingIndex].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        console.log('📝 Updating existing record at index:', existingIndex)
        mockConformanceRecords[existingIndex] = recordData
      } else {
        console.log('📝 Adding new record to mock data')
        mockConformanceRecords.push(recordData)
      }
      
      console.log('📝 Save complete. Total records:', mockConformanceRecords.length)
      console.log('📝 Saved record:', recordData)
      console.log('📝 All records for this lot:', mockConformanceRecords.filter(r => String(r.lot_id) === normalizedLotId))

      revalidatePath(`/project/*/lot/${lotId}`)
      return { success: true, data: recordData, message: 'Inspection saved successfully (mock data)' }
    }
  } catch (error) {
    console.error('❌ saveConformanceRecordAction error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save inspection' 
    }
  }
}

export async function getConformanceRecordsAction(lotId: number | string): Promise<APIResponse<ConformanceRecord[]>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching conformance records from Supabase...')
      const { data: records, error } = await supabase
        .from('conformance_records')
        .select('*')
        .eq('lot_id', lotId)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched conformance records from Supabase:', records?.length || 0)
      
      // Transform Supabase records to match expected interface
      const transformedRecords = (records || []).map(record => ({
        id: record.id,
        lot_id: record.lot_id,
        itp_item_id: record.itp_item_id,
        result_pass_fail: record.result || 'PASS',
        result_numeric: undefined,
        result_text: record.notes,
        comments: record.notes,
        is_non_conformance: record.result === 'FAIL',
        corrective_action: undefined,
        inspector_id: 1,
        inspection_date: record.inspection_date,
        created_at: record.created_at,
        updated_at: record.updated_at
      }))
      
      return { success: true, data: transformedRecords }
    } else {
      console.log('📝 Fetching conformance records from mock data...')
      const records = mockConformanceRecords.filter(r => compareIds(r.lot_id, lotId))
      console.log('getConformanceRecordsAction: Found', records.length, 'records for lot', lotId)
      return { success: true, data: records }
    }
  } catch (error) {
    return { success: false, error: 'Failed to fetch conformance records' }
  }
}

// ==================== DASHBOARD STATS ACTIONS ====================

export async function getDashboardStatsAction(): Promise<APIResponse<ProjectStats>> {
  try {
    await requireAuth()
    
    const stats: ProjectStats = {
      total_projects: mockProjects.length,
      active_projects: mockProjects.filter(p => p.status === 'active').length,
      completed_projects: mockProjects.filter(p => p.status === 'completed').length,
      total_lots: mockLots.length,
      pending_inspections: mockLots.filter(l => l.status === 'pending').length,
      completed_inspections: mockLots.filter(l => l.status === 'completed').length,
      non_conformances: mockConformanceRecords.filter(r => r.is_non_conformance).length
    }

    return { success: true, data: stats }
  } catch (error) {
    return { success: false, error: 'Failed to fetch dashboard stats' }
  }
}

// ==================== REPORT GENERATION ACTIONS ====================

export async function generateInspectionSummaryReportAction(
  projectId?: string, 
  dateRange?: string
): Promise<APIResponse<any>> {
  try {
    await requireAuth()
    
    // Filter data based on parameters
    let filteredLots = mockLots
    if (projectId && projectId !== 'all') {
      filteredLots = mockLots.filter(l => compareIds(l.project_id, projectId))
    }
    
    const now = new Date()
    const daysBack = dateRange === 'all' ? null : parseInt(dateRange || '30')
    
    if (daysBack) {
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
      filteredLots = filteredLots.filter(l => new Date(l.created_at) >= cutoffDate)
    }
    
    // Generate summary data
    const totalInspections = mockConformanceRecords.filter(r => 
      filteredLots.some(l => compareIds(l.id, r.lot_id))
    ).length
    
    const passedInspections = mockConformanceRecords.filter(r => 
      r.result_pass_fail === 'PASS' && filteredLots.some(l => compareIds(l.id, r.lot_id))
    ).length
    
    const failedInspections = mockConformanceRecords.filter(r => 
      r.result_pass_fail === 'FAIL' && filteredLots.some(l => compareIds(l.id, r.lot_id))
    ).length
    
    const reportData = {
      generated_at: now.toISOString(),
      date_range: dateRange,
      project_filter: projectId,
      summary: {
        total_lots: filteredLots.length,
        total_inspections: totalInspections,
        passed_inspections: passedInspections,
        failed_inspections: failedInspections,
        pass_rate: totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0
      },
      lots: filteredLots.map(lot => {
        const project = mockProjects.find(p => compareIds(p.id, lot.project_id))
        const lotRecords = mockConformanceRecords.filter(r => compareIds(r.lot_id, lot.id))
        const lotPassed = lotRecords.filter(r => r.result_pass_fail === 'PASS').length
        const lotFailed = lotRecords.filter(r => r.result_pass_fail === 'FAIL').length
        
        return {
          lot_number: lot.lot_number,
          project_name: project?.name || 'Unknown Project',
          status: lot.status,
          total_inspections: lotRecords.length,
          passed: lotPassed,
          failed: lotFailed,
          completion_rate: lotRecords.length > 0 ? Math.round(((lotPassed + lotFailed) / lotRecords.length) * 100) : 0
        }
      })
    }
    
    return { success: true, data: reportData, message: 'Inspection summary report generated successfully' }
  } catch (error) {
    return { success: false, error: 'Failed to generate inspection summary report' }
  }
}

export async function generateNonConformanceReportAction(
  projectId?: string, 
  dateRange?: string
): Promise<APIResponse<any>> {
  try {
    await requireAuth()
    
    // Filter conformance records for non-conformances
    let nonConformances = mockConformanceRecords.filter(r => r.is_non_conformance || r.result_pass_fail === 'FAIL')
    
    if (projectId && projectId !== 'all') {
      const projectLots = mockLots.filter(l => compareIds(l.project_id, projectId))
      nonConformances = nonConformances.filter(r => 
        projectLots.some(l => compareIds(l.id, r.lot_id))
      )
    }
    
    const now = new Date()
    const daysBack = dateRange === 'all' ? null : parseInt(dateRange || '30')
    
    if (daysBack) {
      const cutoffDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000))
      nonConformances = nonConformances.filter(r => new Date(r.created_at) >= cutoffDate)
    }
    
    const reportData = {
      generated_at: now.toISOString(),
      date_range: dateRange,
      project_filter: projectId,
      summary: {
        total_non_conformances: nonConformances.length,
        open_issues: nonConformances.filter(r => !r.corrective_action || r.corrective_action.trim() === '').length,
        resolved_issues: nonConformances.filter(r => r.corrective_action && r.corrective_action.trim() !== '').length
      },
      non_conformances: nonConformances.map(record => {
        const lot = mockLots.find(l => compareIds(l.id, record.lot_id))
        const project = lot ? mockProjects.find(p => compareIds(p.id, lot.project_id)) : null
        const itpItem = mockITPItems.find(i => compareIds(i.id, record.itp_item_id))
        
        return {
          project_name: project?.name || 'Unknown Project',
          lot_number: lot?.lot_number || 'Unknown Lot',
          inspection_item: itpItem?.description || 'Unknown Item',
          issue_date: record.created_at,
          result: record.result_pass_fail,
          comments: record.comments || '',
          corrective_action: record.corrective_action || 'Pending',
          status: record.corrective_action ? 'Resolved' : 'Open'
        }
      })
    }
    
    return { success: true, data: reportData, message: 'Non-conformance report generated successfully' }
  } catch (error) {
    return { success: false, error: 'Failed to generate non-conformance report' }
  }
}

export async function generateProjectProgressReportAction(
  projectId?: string, 
  dateRange?: string
): Promise<APIResponse<any>> {
  try {
    await requireAuth()
    
    let filteredProjects = mockProjects
    if (projectId && projectId !== 'all') {
      filteredProjects = mockProjects.filter(p => compareIds(p.id, projectId))
    }
    
    const reportData = {
      generated_at: new Date().toISOString(),
      date_range: dateRange,
      project_filter: projectId,
      projects: filteredProjects.map(project => {
        const projectLots = mockLots.filter(l => compareIds(l.project_id, project.id))
        const completedLots = projectLots.filter(l => l.status === 'completed').length
        const inProgressLots = projectLots.filter(l => l.status === 'in_progress').length
        const pendingLots = projectLots.filter(l => l.status === 'pending').length
        
        const totalInspections = mockConformanceRecords.filter(r => 
          projectLots.some(l => compareIds(l.id, r.lot_id))
        ).length
        
        const passedInspections = mockConformanceRecords.filter(r => 
          r.result_pass_fail === 'PASS' && projectLots.some(l => compareIds(l.id, r.lot_id))
        ).length
        
        return {
          project_name: project.name,
          project_number: project.project_number,
          status: project.status,
          location: project.location,
          created_date: project.created_at,
          lots: {
            total: projectLots.length,
            completed: completedLots,
            in_progress: inProgressLots,
            pending: pendingLots,
            completion_rate: projectLots.length > 0 ? Math.round((completedLots / projectLots.length) * 100) : 0
          },
          quality: {
            total_inspections: totalInspections,
            passed_inspections: passedInspections,
            pass_rate: totalInspections > 0 ? Math.round((passedInspections / totalInspections) * 100) : 0
          }
        }
      })
    }
    
    return { success: true, data: reportData, message: 'Project progress report generated successfully' }
  } catch (error) {
    return { success: false, error: 'Failed to generate project progress report' }
  }
}

// ==================== SITE DIARY ACTIONS ====================

export async function saveDailyReportAction(data: CreateDailyReportRequest): Promise<APIResponse<DailyReport>> {
  try {
    const user = await requireAuth()
    
    console.log('saveDailyReportAction: Saving daily report for lot', data.lot_id)
    
    // Check if report already exists for this lot and date
    const existingIndex = mockDailyReports.findIndex(
      r => compareIds(r.lot_id, data.lot_id) && r.report_date === data.report_date
    )

    const reportData: DailyReport = {
      id: existingIndex >= 0 ? mockDailyReports[existingIndex].id : mockDailyReports.length + 1,
      ...data,
      created_by: user.id,
      created_at: existingIndex >= 0 ? mockDailyReports[existingIndex].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (existingIndex >= 0) {
      mockDailyReports[existingIndex] = reportData
    } else {
      mockDailyReports.push(reportData)
    }
    
    revalidatePath(`/project/${data.lot_id}`)
    
    return { success: true, data: reportData, message: 'Daily report saved successfully' }
  } catch (error) {
    console.error('Save daily report error:', error)
    return { success: false, error: 'Failed to save daily report' }
  }
}

export async function createDailyEventAction(data: CreateDailyEventRequest): Promise<APIResponse<DailyEvent>> {
  try {
    const user = await requireAuth()
    
    console.log('createDailyEventAction: Creating daily event for lot', data.lot_id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating daily event in Supabase...')
      
      const { data: newEvent, error } = await supabase
        .from('daily_events')
        .insert({
          lot_id: data.lot_id,
          event_date: data.event_date,
          event_time: data.event_time || null,
          event_type: data.event_type,
          title: data.title,
          description: data.description || null,
          severity: data.severity || 'low',
          status: 'open',
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Daily event created in Supabase:', newEvent)
      revalidatePath(`/project/${data.lot_id}`)
      return { success: true, data: newEvent, message: 'Event created successfully' }
    } else {
      console.log('📝 Creating daily event in mock data...')
      const eventData: DailyEvent = {
        id: mockDailyEvents.length + 1,
        ...data,
        severity: data.severity || 'low',
        status: 'open',
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockDailyEvents.push(eventData)
      revalidatePath(`/project/${data.lot_id}`)
      
      return { success: true, data: eventData, message: 'Event created successfully' }
    }
  } catch (error) {
    console.error('Create daily event error:', error)
    return { success: false, error: 'Failed to create event' }
  }
}

export async function createDailyLabourAction(data: CreateDailyLabourRequest): Promise<APIResponse<DailyLabour>> {
  try {
    const user = await requireAuth()
    
    console.log('createDailyLabourAction: Creating daily labour record for lot', data.lot_id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating daily labour in Supabase...')
      
      const { data: newLabour, error } = await supabase
        .from('daily_labour')
        .insert({
          lot_id: data.lot_id,
          work_date: data.work_date,
          worker_name: data.worker_name,
          trade: data.trade || null,
          hours_worked: data.hours_worked,
          hourly_rate: data.hourly_rate || null,
          overtime_hours: data.overtime_hours || 0,
          overtime_rate: data.overtime_rate || null,
          task_description: data.task_description || null,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Daily labour created in Supabase:', newLabour)
      revalidatePath(`/project/${data.lot_id}`)
      return { success: true, data: newLabour, message: 'Labour record created successfully' }
    } else {
      console.log('📝 Creating daily labour in mock data...')
      const labourData: DailyLabour = {
        id: mockDailyLabour.length + 1,
        ...data,
        overtime_hours: data.overtime_hours || 0,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockDailyLabour.push(labourData)
      revalidatePath(`/project/${data.lot_id}`)
      
      return { success: true, data: labourData, message: 'Labour record created successfully' }
    }
  } catch (error) {
    console.error('Create daily labour error:', error)
    return { success: false, error: 'Failed to create labour record' }
  }
}

export async function createDailyPlantAction(data: CreateDailyPlantRequest): Promise<APIResponse<DailyPlant>> {
  try {
    const user = await requireAuth()
    
    console.log('createDailyPlantAction: Creating daily plant record for lot', data.lot_id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating daily plant in Supabase...')
      
      const { data: newPlant, error } = await supabase
        .from('daily_plant')
        .insert({
          lot_id: data.lot_id,
          work_date: data.work_date,
          equipment_type: data.equipment_type,
          equipment_id: data.equipment_id || null,
          operator_name: data.operator_name || null,
          hours_used: data.hours_used,
          hourly_rate: data.hourly_rate || null,
          fuel_consumed: data.fuel_consumed || null,
          maintenance_notes: data.maintenance_notes || null,
          task_description: data.task_description || null,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Daily plant created in Supabase:', newPlant)
      revalidatePath(`/project/${data.lot_id}`)
      return { success: true, data: newPlant, message: 'Plant record created successfully' }
    } else {
      console.log('📝 Creating daily plant in mock data...')
      const plantData: DailyPlant = {
        id: mockDailyPlant.length + 1,
        ...data,
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockDailyPlant.push(plantData)
      revalidatePath(`/project/${data.lot_id}`)
      
      return { success: true, data: plantData, message: 'Plant record created successfully' }
    }
  } catch (error) {
    console.error('Create daily plant error:', error)
    return { success: false, error: 'Failed to create plant record' }
  }
}

export async function createDailyMaterialsAction(data: CreateDailyMaterialsRequest): Promise<APIResponse<DailyMaterials>> {
  try {
    const user = await requireAuth()
    
    console.log('createDailyMaterialsAction: Creating daily materials record for lot', data.lot_id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating daily materials in Supabase...')
      
      const { data: newMaterials, error } = await supabase
        .from('daily_materials')
        .insert({
          lot_id: data.lot_id,
          delivery_date: data.delivery_date,
          material_type: data.material_type,
          supplier: data.supplier || null,
          quantity: data.quantity,
          unit_measure: data.unit_measure || null,
          unit_cost: data.unit_cost || null,
          total_cost: data.total_cost || (data.unit_cost && data.quantity ? data.unit_cost * data.quantity : null),
          delivery_docket: data.delivery_docket || null,
          quality_notes: data.quality_notes || null,
          received_by: data.received_by || null,
          created_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Daily materials created in Supabase:', newMaterials)
      revalidatePath(`/project/${data.lot_id}`)
      return { success: true, data: newMaterials, message: 'Materials record created successfully' }
    } else {
      console.log('📝 Creating daily materials in mock data...')
      const materialsData: DailyMaterials = {
        id: mockDailyMaterials.length + 1,
        ...data,
        total_cost: data.total_cost || (data.unit_cost && data.quantity ? data.unit_cost * data.quantity : 0),
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockDailyMaterials.push(materialsData)
      revalidatePath(`/project/${data.lot_id}`)
      
      return { success: true, data: materialsData, message: 'Materials record created successfully' }
    }
  } catch (error) {
    console.error('Create daily materials error:', error)
    return { success: false, error: 'Failed to create materials record' }
  }
}

export async function getDailyReportsByLotAction(lotId: number | string): Promise<APIResponse<DailyReport[]>> {
  try {
    await requireAuth()
    
    const reports = mockDailyReports.filter(r => compareIds(r.lot_id, lotId))
    return { success: true, data: reports }
  } catch (error) {
    console.error('Get daily reports error:', error)
    return { success: false, error: 'Failed to fetch daily reports' }
  }
}

export async function getDailyEventsByLotAction(lotId: number | string): Promise<APIResponse<DailyEvent[]>> {
  try {
    await requireAuth()
    
    console.log('getDailyEventsByLotAction: Fetching daily events for lot', lotId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily events from Supabase...')
      
      const { data: events, error } = await supabase
        .from('daily_events')
        .select('*')
        .eq('lot_id', lotId)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily events from Supabase:', events?.length || 0)
      return { success: true, data: events || [] }
    } else {
      console.log('📝 Fetching daily events from mock data...')
      const events = mockDailyEvents.filter(e => compareIds(e.lot_id, lotId))
      return { success: true, data: events }
    }
  } catch (error) {
    console.error('Get daily events error:', error)
    return { success: false, error: 'Failed to fetch daily events' }
  }
}

export async function getDailyLabourByLotAction(lotId: number | string): Promise<APIResponse<DailyLabour[]>> {
  try {
    await requireAuth()
    
    console.log('getDailyLabourByLotAction: Fetching daily labour for lot', lotId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily labour from Supabase...')
      
      const { data: labour, error } = await supabase
        .from('daily_labour')
        .select('*')
        .eq('lot_id', lotId)
        .order('work_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily labour from Supabase:', labour?.length || 0)
      return { success: true, data: labour || [] }
    } else {
      console.log('📝 Fetching daily labour from mock data...')
      const labour = mockDailyLabour.filter(l => compareIds(l.lot_id, lotId))
      return { success: true, data: labour }
    }
  } catch (error) {
    console.error('Get daily labour error:', error)
    return { success: false, error: 'Failed to fetch daily labour records' }
  }
}

export async function getDailyPlantByLotAction(lotId: number | string): Promise<APIResponse<DailyPlant[]>> {
  try {
    await requireAuth()
    
    console.log('getDailyPlantByLotAction: Fetching daily plant for lot', lotId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily plant from Supabase...')
      
      const { data: plant, error } = await supabase
        .from('daily_plant')
        .select('*')
        .eq('lot_id', lotId)
        .order('usage_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily plant from Supabase:', plant?.length || 0)
      return { success: true, data: plant || [] }
    } else {
      console.log('📝 Fetching daily plant from mock data...')
      const plant = mockDailyPlant.filter(p => compareIds(p.lot_id, lotId))
      return { success: true, data: plant }
    }
  } catch (error) {
    console.error('Get daily plant error:', error)
    return { success: false, error: 'Failed to fetch daily plant records' }
  }
}

export async function getDailyMaterialsByLotAction(lotId: number | string): Promise<APIResponse<DailyMaterials[]>> {
  try {
    await requireAuth()
    
    console.log('getDailyMaterialsByLotAction: Fetching daily materials for lot', lotId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily materials from Supabase...')
      
      const { data: materials, error } = await supabase
        .from('daily_materials')
        .select('*')
        .eq('lot_id', lotId)
        .order('delivery_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily materials from Supabase:', materials?.length || 0)
      return { success: true, data: materials || [] }
    } else {
      console.log('📝 Fetching daily materials from mock data...')
      const materials = mockDailyMaterials.filter(m => compareIds(m.lot_id, lotId))
      return { success: true, data: materials }
    }
  } catch (error) {
    console.error('Get daily materials error:', error)
    return { success: false, error: 'Failed to fetch daily materials records' }
  }
}

export async function getDailyReportByDateAction(lotId: number | string, date: string): Promise<APIResponse<DailyReport | null>> {
  try {
    await requireAuth()
    
    const report = mockDailyReports.find(r => 
      compareIds(r.lot_id, lotId) && r.report_date === date
    )
    return { success: true, data: report || null }
  } catch (error) {
    console.error('Get daily report by date error:', error)
    return { success: false, error: 'Failed to fetch daily report' }
  }
}

// ==================== PROJECT-LEVEL SITE DIARY ACTIONS ====================

export async function getDailyReportsByProjectAction(projectId: number | string): Promise<APIResponse<DailyReport[]>> {
  try {
    await requireAuth()
    
    // Get all lots for this project
    const project = await getProjectByIdAction(projectId)
    if (!project.success || !project.data) {
      return { success: false, error: 'Project not found' }
    }
    
    const lotIds = project.data.lots.map(lot => lot.id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily reports from Supabase for project...', projectId)
      
      const { data: reports, error } = await supabase
        .from('daily_reports')
        .select('*')
        .in('lot_id', lotIds)
        .order('report_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily reports from Supabase:', reports?.length || 0)
      return { success: true, data: reports || [] }
    } else {
      console.log('📝 Fetching daily reports from mock data for project...', projectId)
      const reports = mockDailyReports.filter(r => 
        lotIds.some(lotId => compareIds(r.lot_id, lotId))
      )
      return { success: true, data: reports }
    }
  } catch (error) {
    console.error('Get daily reports by project error:', error)
    return { success: false, error: 'Failed to fetch daily reports' }
  }
}

export async function getDailyEventsByProjectAction(projectId: number | string): Promise<APIResponse<DailyEvent[]>> {
  try {
    await requireAuth()
    
    // Get all lots for this project
    const project = await getProjectByIdAction(projectId)
    if (!project.success || !project.data) {
      return { success: false, error: 'Project not found' }
    }
    
    const lotIds = project.data.lots.map(lot => lot.id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily events from Supabase for project...', projectId)
      
      const { data: events, error } = await supabase
        .from('daily_events')
        .select('*')
        .in('lot_id', lotIds)
        .order('event_date', { ascending: false })
        .order('event_time', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily events from Supabase:', events?.length || 0)
      return { success: true, data: events || [] }
    } else {
      console.log('📝 Fetching daily events from mock data for project...', projectId)
      const events = mockDailyEvents.filter(e => 
        lotIds.some(lotId => compareIds(e.lot_id, lotId))
      )
      return { success: true, data: events }
    }
  } catch (error) {
    console.error('Get daily events by project error:', error)
    return { success: false, error: 'Failed to fetch daily events' }
  }
}

export async function getDailyLabourByProjectAction(projectId: number | string): Promise<APIResponse<DailyLabour[]>> {
  try {
    await requireAuth()
    
    // Get all lots for this project
    const project = await getProjectByIdAction(projectId)
    if (!project.success || !project.data) {
      return { success: false, error: 'Project not found' }
    }
    
    const lotIds = project.data.lots.map(lot => lot.id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily labour from Supabase for project...', projectId)
      
      const { data: labour, error } = await supabase
        .from('daily_labour')
        .select('*')
        .in('lot_id', lotIds)
        .order('work_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily labour from Supabase:', labour?.length || 0)
      return { success: true, data: labour || [] }
    } else {
      console.log('📝 Fetching daily labour from mock data for project...', projectId)
      const labour = mockDailyLabour.filter(l => 
        lotIds.some(lotId => compareIds(l.lot_id, lotId))
      )
      return { success: true, data: labour }
    }
  } catch (error) {
    console.error('Get daily labour by project error:', error)
    return { success: false, error: 'Failed to fetch daily labour records' }
  }
}

export async function getDailyPlantByProjectAction(projectId: number | string): Promise<APIResponse<DailyPlant[]>> {
  try {
    await requireAuth()
    
    // Get all lots for this project
    const project = await getProjectByIdAction(projectId)
    if (!project.success || !project.data) {
      return { success: false, error: 'Project not found' }
    }
    
    const lotIds = project.data.lots.map(lot => lot.id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily plant from Supabase for project...', projectId)
      
      const { data: plant, error } = await supabase
        .from('daily_plant')
        .select('*')
        .in('lot_id', lotIds)
        .order('work_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily plant from Supabase:', plant?.length || 0)
      return { success: true, data: plant || [] }
    } else {
      console.log('📝 Fetching daily plant from mock data for project...', projectId)
      const plant = mockDailyPlant.filter(p => 
        lotIds.some(lotId => compareIds(p.lot_id, lotId))
      )
      return { success: true, data: plant }
    }
  } catch (error) {
    console.error('Get daily plant by project error:', error)
    return { success: false, error: 'Failed to fetch daily plant records' }
  }
}

export async function getDailyMaterialsByProjectAction(projectId: number | string): Promise<APIResponse<DailyMaterials[]>> {
  try {
    await requireAuth()
    
    // Get all lots for this project
    const project = await getProjectByIdAction(projectId)
    if (!project.success || !project.data) {
      return { success: false, error: 'Project not found' }
    }
    
    const lotIds = project.data.lots.map(lot => lot.id)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching daily materials from Supabase for project...', projectId)
      
      const { data: materials, error } = await supabase
        .from('daily_materials')
        .select('*')
        .in('lot_id', lotIds)
        .order('delivery_date', { ascending: false })
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched daily materials from Supabase:', materials?.length || 0)
      return { success: true, data: materials || [] }
    } else {
      console.log('📝 Fetching daily materials from mock data for project...', projectId)
      const materials = mockDailyMaterials.filter(m => 
        lotIds.some(lotId => compareIds(m.lot_id, lotId))
      )
      return { success: true, data: materials }
    }
  } catch (error) {
    console.error('Get daily materials by project error:', error)
    return { success: false, error: 'Failed to fetch daily materials records' }
  }
}

// ==================== NEW ITP SCHEMA ACTIONS ====================

export async function createITPFromTemplateAction(request: CreateITPFromTemplateRequest): Promise<APIResponse<ITP>> {
  try {
    const user = await requireAuth()
    
    console.log('createITPFromTemplateAction: Creating ITP from template', request)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating ITP from template in Supabase...')
      
      // Call the database function
      const { data: itpId, error } = await supabase
        .rpc('create_itp_from_template', {
          p_template_id: request.template_id,
          p_project_id: request.project_id || null,
          p_lot_id: request.lot_id || null,
          p_name: request.name || null,
          p_created_by: user.id
        })
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      // Fetch the created ITP
      const { data: itp, error: fetchError } = await supabase
        .from('itps')
        .select('*')
        .eq('id', itpId)
        .single()
      
      if (fetchError || !itp) {
        console.error('Error fetching created ITP:', fetchError)
        return { success: false, error: 'Failed to fetch created ITP' }
      }
      
      console.log('✅ ITP created successfully:', itp)
      
      if (request.lot_id) {
        revalidatePath(`/project/${request.project_id}/lot/${request.lot_id}`)
      }
      
      return { success: true, data: itp, message: 'ITP created successfully from template' }
    } else {
      // Mock implementation
      return { success: false, error: 'Mock implementation not available for new ITP schema' }
    }
  } catch (error) {
    console.error('Create ITP from template error:', error)
    return { success: false, error: 'Failed to create ITP from template' }
  }
}

export async function getITPByIdAction(itpId: number | string): Promise<APIResponse<ITPWithDetails>> {
  try {
    await requireAuth()
    
    console.log('getITPByIdAction: Fetching ITP', itpId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching ITP from Supabase...')
      
      const { data: itp, error } = await supabase
        .from('itps')
        .select(`
          *,
          template:itp_templates(*),
          project:projects(*),
          lot:lots(*),
          items:itp_items(
            *,
            template_item:itp_template_items(*)
          ),
          assignments:itp_assignments(*)
        `)
        .eq('id', itpId)
        .single()
      
      if (error || !itp) {
        console.error('Database error:', error)
        return { success: false, error: 'ITP not found' }
      }
      
      console.log('✅ Fetched ITP from Supabase')
      return { success: true, data: itp }
    } else {
      // Mock implementation
      return { success: false, error: 'Mock implementation not available for new ITP schema' }
    }
  } catch (error) {
    console.error('Get ITP by ID error:', error)
    return { success: false, error: 'Failed to fetch ITP' }
  }
}

export async function updateITPItemAction(
  itpId: number | string, 
  itemId: number | string, 
  updates: UpdateITPItemRequest
): Promise<APIResponse<ITPItem>> {
  try {
    const user = await requireAuth()
    
    console.log('updateITPItemAction: Updating item', itemId, 'in ITP', itpId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Updating ITP item in Supabase...')
      
      // Update the item
      const updateData: any = {
        ...updates,
        updated_at: new Date().toISOString()
      }
      
      if (updates.status && !updates.inspected_by) {
        updateData.inspected_by = user.id
      }
      
      if (updates.status && !updates.inspected_date) {
        updateData.inspected_date = new Date().toISOString()
      }
      
      const { data: item, error } = await supabase
        .from('itp_items')
        .update(updateData)
        .eq('id', itemId)
        .eq('itp_id', itpId)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      // Trigger ITP status update
      await supabase.rpc('update_itp_status', { p_itp_id: itpId })
      
      console.log('✅ ITP item updated successfully')
      return { success: true, data: item, message: 'Item updated successfully' }
    } else {
      // Mock implementation
      return { success: false, error: 'Mock implementation not available for new ITP schema' }
    }
  } catch (error) {
    console.error('Update ITP item error:', error)
    return { success: false, error: 'Failed to update ITP item' }
  }
}

export async function getITPOverviewAction(filters?: {
  project_id?: string;
  lot_id?: string;
  status?: string;
}): Promise<APIResponse<VITPOverview[]>> {
  try {
    await requireAuth()
    
    console.log('getITPOverviewAction: Fetching ITP overview', filters)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Fetching ITP overview from Supabase...')
      
      let query = supabase.from('v_itp_overview').select('*')
      
      if (filters?.project_id) {
        query = query.eq('project_id', filters.project_id)
      }
      if (filters?.lot_id) {
        query = query.eq('lot_id', filters.lot_id)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }
      
      query = query.order('created_at', { ascending: false })
      
      const { data, error } = await query
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched ITP overview:', data?.length || 0, 'records')
      return { success: true, data: data || [] }
    } else {
      // Mock implementation
      return { success: false, error: 'Mock implementation not available for new ITP schema' }
    }
  } catch (error) {
    console.error('Get ITP overview error:', error)
    return { success: false, error: 'Failed to fetch ITP overview' }
  }
}

export async function createITPAssignmentAction(
  request: CreateITPAssignmentRequest
): Promise<APIResponse<ITPAssignment>> {
  try {
    const user = await requireAuth()
    
    console.log('createITPAssignmentAction: Creating assignment', request)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating ITP assignment in Supabase...')
      
      const { data: assignment, error } = await supabase
        .from('itp_assignments')
        .insert({
          itp_id: request.itp_id,
          assigned_to: request.assigned_to,
          assigned_by: user.id,
          role: request.role || 'Inspector',
          scheduled_date: request.scheduled_date,
          notes: request.notes,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ ITP assignment created successfully')
      return { success: true, data: assignment, message: 'Assignment created successfully' }
    } else {
      // Mock implementation
      return { success: false, error: 'Mock implementation not available for new ITP schema' }
    }
  } catch (error) {
    console.error('Create ITP assignment error:', error)
    return { success: false, error: 'Failed to create ITP assignment' }
  }
}

// ==================== FORM ACTION WRAPPERS ====================

export async function handleSignup(formData: FormData) {
  const result = await signupAction(formData)
  if (result.success) {
    redirect('/dashboard')
  }
  return result
}

export async function handleLogin(formData: FormData) {
  const result = await loginAction(formData)
  if (result.success) {
    redirect('/dashboard')
  }
  return result
}

// Mock data is initialized in mock-data.ts