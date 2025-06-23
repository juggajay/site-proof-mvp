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
  CreateITPAssignmentRequest, UpdateITPItemRequest, VITPOverview,
  Company, Subcontractor, SubcontractorEmployee, PlantProfile, MaterialProfile,
  CreateCompanyRequest, CreateSubcontractorRequest, CreateSubcontractorEmployeeRequest,
  CreatePlantProfileRequest, CreateMaterialProfileRequest, ProjectCostSummary
} from '@/types/database'

// Import shared mock database storage
import { 
  mockUsers, mockProfiles, mockOrganizations, mockUserOrganizations, mockProjects, mockLots,
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

// Helper function to get user's organization ID
async function getUserOrganizationId(userId: number | string): Promise<string | null> {
  if (isSupabaseEnabled && supabase) {
    // When using Supabase with mock auth, we need a workaround
    // Try to get the first organization from the database
    console.log('getUserOrganizationId: Fetching organization for Supabase mode with mock auth')
    
    try {
      // First, try to get any existing organization
      const { data: orgs, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
      
      if (!orgError && orgs && orgs.length > 0) {
        console.log('getUserOrganizationId: Found existing organization:', orgs[0].id)
        return orgs[0].id
      }
      
      // If no organization exists, create a default one
      console.log('getUserOrganizationId: No organization found, creating default')
      const { data: newOrg, error: createError } = await supabase
        .from('organizations')
        .insert({
          name: 'Default Organization',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single()
      
      if (!createError && newOrg) {
        console.log('getUserOrganizationId: Created new organization:', newOrg.id)
        return newOrg.id
      }
      
      console.error('getUserOrganizationId: Failed to create organization:', createError)
      // As a last resort, return a hardcoded organization ID
      console.log('getUserOrganizationId: Using fallback organization ID')
      return '550e8400-e29b-41d4-a716-446655440001'
    } catch (error) {
      console.error('getUserOrganizationId: Error:', error)
      // Return fallback organization ID
      return '550e8400-e29b-41d4-a716-446655440001'
    }
  } else {
    // Mock implementation
    const userOrg = mockUserOrganizations.find(uo => uo.user_id === userId)
    return userOrg ? String(userOrg.organization_id) : null
  }
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
      
      // Check if ITP template exists
      const { data: template, error: templateError } = await supabase
        .from('itp_templates')
        .select('*')
        .eq('id', itpTemplateId)
        .single()
      
      if (templateError || !template) {
        console.log('ITP template not found:', templateError)
        return { success: false, error: `ITP template not found: ${itpTemplateId}` }
      }
      
      console.log('Found ITP template:', { id: template.id, name: template.name })
      
      // Check if already assigned
      const { data: existingAssignment } = await supabase
        .from('lot_itp_templates')
        .select('*')
        .eq('lot_id', lotId)
        .eq('itp_template_id', itpTemplateId)
        .single()
      
      if (existingAssignment) {
        if (!existingAssignment.is_active) {
          // Reactivate if it was deactivated
          const { error: reactivateError } = await supabase
            .from('lot_itp_templates')
            .update({
              is_active: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingAssignment.id)
          
          if (reactivateError) {
            console.error('Failed to reactivate assignment:', reactivateError)
            return { success: false, error: 'Failed to reactivate ITP assignment' }
          }
        }
        return { success: true, data: lot, message: 'ITP template already assigned' }
      }
      
      // Create new assignment in junction table
      console.log('Creating new ITP assignment in lot_itp_templates...')
      const { data: newAssignment, error: assignError } = await supabase
        .from('lot_itp_templates')
        .insert({
          lot_id: lotId,
          itp_template_id: itpTemplateId,
          assigned_by: user.id,
          is_active: true,
          assigned_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (assignError) {
        console.error('Failed to create assignment:', assignError)
        return { success: false, error: `Failed to assign ITP: ${assignError.message}` }
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
      
      console.log('✅ ITP assigned in Supabase:', newAssignment)
      revalidatePath(`/project/${lot.project_id}`)
      return { success: true, data: lot, message: 'ITP assigned successfully' }
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

export async function assignMultipleITPsToLotAction(lotId: number | string, itpTemplateIds: (number | string)[]): Promise<APIResponse<Lot>> {
  try {
    const user = await requireAuth()
    
    console.log('assignMultipleITPsToLotAction: Assigning templates', itpTemplateIds, 'to lot', lotId)
    console.log('Template ID types:', itpTemplateIds.map(id => typeof id))
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Assigning multiple ITPs in Supabase...')
      
      // Convert IDs to strings for UUID compatibility
      // Both lots.id and itp_templates.id are UUIDs in Supabase
      const lotIdString = String(lotId)
      const templateIds = itpTemplateIds.map(id => String(id))
      
      // First check if lot exists
      const { data: lot, error: lotError } = await supabase
        .from('lots')
        .select('*')
        .eq('id', lotIdString)
        .single()
      
      if (lotError || !lot) {
        console.log('Lot not found:', lotError)
        return { success: false, error: 'Lot not found' }
      }
      
      // Verify all ITP templates exist
      const { data: templates, error: templateError } = await supabase
        .from('itp_templates')
        .select('*')
        .in('id', templateIds)
      
      if (templateError || !templates || templates.length !== templateIds.length) {
        console.log('Some ITP templates not found:', templateError)
        console.log('Requested IDs:', templateIds)
        console.log('Found templates:', templates?.map(t => t.id))
        return { success: false, error: `One or more ITP templates not found. Requested: ${templateIds.join(', ')}` }
      }
      
      console.log('Found ITP templates:', templates.map(t => ({ id: t.id, name: t.name })))
      
      // Get existing assignments
      const { data: existingAssignments } = await supabase
        .from('lot_itp_assignments')
        .select('*')
        .eq('lot_id', lotIdString)
        .in('template_id', templateIds)
      
      const existingTemplateIds = existingAssignments?.map(a => String(a.template_id)) || []
      const newTemplateIds = templateIds.filter(id => !existingTemplateIds.includes(id))
      
      // Reactivate any inactive existing assignments
      if (existingAssignments && existingAssignments.length > 0) {
        const inactiveAssignments = existingAssignments.filter(a => !a.is_active)
        if (inactiveAssignments.length > 0) {
          const { error: reactivateError } = await supabase
            .from('lot_itp_assignments')
            .update({
              status: 'pending',
              updated_at: new Date().toISOString()
            })
            .in('id', inactiveAssignments.map(a => a.id))
          
          if (reactivateError) {
            console.error('Failed to reactivate assignments:', reactivateError)
            return { success: false, error: 'Failed to reactivate ITP assignments' }
          }
        }
      }
      
      // Create new assignments
      if (newTemplateIds.length > 0) {
        console.log('Creating new ITP assignments in lot_itp_assignments...')
        console.log('New template IDs to assign:', newTemplateIds)
        console.log('Lot ID (UUID):', lotIdString, 'Type:', typeof lotIdString)
        console.log('User ID:', user.id, 'Type:', typeof user.id)
        console.log('User object:', JSON.stringify(user, null, 2))
        
        // Handle user ID - in Supabase with mock auth, we might need to use a different approach
        // The assigned_by field references auth.users which expects UUID
        // For now, we'll make it nullable in case of mock auth
        const assignedByUserId = typeof user.id === 'number' ? null : String(user.id)
        
        // For each template, create an assignment
        for (const templateId of newTemplateIds) {
          console.log('🔧 Creating assignment for template:', templateId)
          
          // Get the template details
          const template = templates.find(t => t.id === templateId)
          
          // Get existing assignments to determine sequence number
          const { data: existingSeq } = await supabase
            .from('lot_itp_assignments')
            .select('sequence_number')
            .eq('lot_id', lotIdString)
            .eq('template_id', templateId)
            .order('sequence_number', { ascending: false })
            .limit(1)
          
          const sequenceNumber = existingSeq?.[0]?.sequence_number ? existingSeq[0].sequence_number + 1 : 1
          
          // Create the assignment
          const assignment = {
            lot_id: lotIdString,
            template_id: templateId,
            instance_name: `${template?.name || 'ITP'} - Lot ${lot.lot_number}`,
            sequence_number: sequenceNumber,
            status: 'pending',
            assigned_by: assignedByUserId,
            assigned_to: assignedByUserId, // Can be updated later
            assigned_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
          
          console.log('Assignment to insert:', JSON.stringify(assignment, null, 2))
          
          const { data: insertedData, error: assignError } = await supabase
            .from('lot_itp_assignments')
            .insert(assignment)
            .select()
          
          console.log('Inserted assignment:', JSON.stringify(insertedData, null, 2))
          
          if (assignError) {
            console.error('Failed to create assignment:', assignError)
            console.error('Assignment data that failed:', assignment)
            return { success: false, error: `Failed to assign ITP: ${assignError.message}` }
          }
          
          // Create inspection records for each template item
          if (insertedData && insertedData[0]) {
            const assignmentId = insertedData[0].id
            
            // Get template items
            const { data: templateItems } = await supabase
              .from('itp_template_items')
              .select('*')
              .eq('template_id', templateId)
              .order('sort_order')
            
            if (templateItems && templateItems.length > 0) {
              // Create inspection records
              const inspectionRecords = templateItems.map(item => ({
                assignment_id: assignmentId,
                template_item_id: item.id,
                status: 'pending',
                is_non_conforming: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }))
              
              const { error: recordError } = await supabase
                .from('itp_inspection_records')
                .insert(inspectionRecords)
              
              if (recordError) {
                console.error('Failed to create inspection records:', recordError)
                // Continue anyway - records can be created later
              }
            }
          }
        }
      }
      
      // Update lot status if needed
      if (lot.status === 'pending') {
        await supabase
          .from('lots')
          .update({
            status: 'IN_PROGRESS',
            updated_at: new Date().toISOString()
          })
          .eq('id', lotIdString)
      }
      
      console.log('✅ Multiple ITPs assigned in Supabase')
      revalidatePath(`/project/${lot.project_id}`)
      return { success: true, data: lot, message: `${templateIds.length} ITP(s) assigned successfully` }
    } else {
      console.log('📝 Assigning multiple ITPs in mock data...')
      const lot = mockLots.find(l => compareIds(l.id, lotId))
      if (!lot) {
        console.log('assignMultipleITPsToLotAction: Lot not found for ID:', lotId)
        return { success: false, error: 'Lot not found' }
      }

      // Verify all templates exist
      const templates = mockITPTemplates.filter(t => itpTemplateIds.some(id => compareIds(t.id, id)))
      if (templates.length !== itpTemplateIds.length) {
        console.log('assignMultipleITPsToLotAction: Some ITP templates not found')
        return { success: false, error: 'One or more ITP templates not found' }
      }
      
      // Process each template
      for (const itpTemplateId of itpTemplateIds) {
        // Check if already assigned
        const existingAssignment = mockLotITPTemplates.find(lit => 
          compareIds(lit.lot_id, lotId) && compareIds(lit.itp_template_id, itpTemplateId)
        )
        
        if (existingAssignment) {
          if (!existingAssignment.is_active) {
            existingAssignment.is_active = true
            existingAssignment.updated_at = new Date().toISOString()
          }
        } else {
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
        }
      }
      
      // Update lot status if needed
      if (lot.status === 'pending') {
        const lotIndex = mockLots.findIndex(l => compareIds(l.id, lotId))
        mockLots[lotIndex] = {
          ...lot,
          status: 'in_progress',
          updated_at: new Date().toISOString()
        }
      }
      
      console.log('assignMultipleITPsToLotAction: Successfully assigned multiple ITP templates to lot')
      revalidatePath(`/project/${lot.project_id}`)
      return { success: true, data: lot, message: `${itpTemplateIds.length} ITP(s) assigned successfully` }
    }
  } catch (error) {
    return { success: false, error: 'Failed to assign ITPs' }
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
      
      // Get ITP templates from junction table (lot_itp_templates)
      let itpTemplates: any[] = []
      
      console.log('📊 Fetching ITP templates from junction table...')
      console.log('📊 Looking for lot_id:', lotId, 'Type:', typeof lotId)
      
      // Use the same lot ID that worked in the initial query
      const lotIdForJunction = lotIdToUse  // This is the same ID used to fetch the lot
      console.log('📊 Using lot ID for junction query:', lotIdForJunction, 'Original:', lotId)
      
      const { data: lotItpTemplates, error: lotItpError } = await supabase
        .from('lot_itp_assignments')
        .select('*')
        .eq('lot_id', lotIdForJunction)
        .in('status', ['pending', 'in_progress', 'completed', 'approved'])
      
      if (lotItpError) {
        console.error('📊 Error fetching lot_itp_templates:', lotItpError)
      }
      
      console.log('📊 Found lot_itp_templates:', lotItpTemplates?.length || 0)
      
      // Fetch each assigned template with its ITP instance and items
      if (lotItpTemplates && lotItpTemplates.length > 0) {
        for (const assignment of lotItpTemplates) {
          const { data: template, error: templateError } = await supabase
            .from('itp_templates')
            .select('*')
            .eq('id', assignment.template_id)
            .single()
          
          if (templateError) {
            console.error('Error fetching template:', templateError)
            continue
          }
          
          let items = []
          let itpInstance = null
          
          // Fetch template items
          console.log('📊 Fetching template items for template:', assignment.template_id)
          const { data: templateItems } = await supabase
            .from('itp_template_items')
            .select('*')
            .eq('template_id', assignment.template_id)
            .order('sort_order')
          
          items = templateItems || []
          
          // Fetch inspection records for this assignment
          const { data: inspectionRecords } = await supabase
            .from('itp_inspection_records')
            .select('*')
            .eq('assignment_id', assignment.id)
          
          console.log(`✅ Fetched ${items.length} template items and ${inspectionRecords?.length || 0} inspection records`)
          
          if (template) {
            // Map items to expected format with inspection records
            const mappedItems = items.map((item: any) => {
              // Find corresponding inspection record
              const record = inspectionRecords?.find((r: any) => r.template_item_id === item.id)
              
              return {
                ...item,
                // Map template_id to itp_template_id for backward compatibility
                itp_template_id: item.template_id || template.id,
                // Map inspection_type to item_type
                item_type: item.inspection_type === 'boolean' ? 'pass_fail' : 
                          item.inspection_type === 'numeric' ? 'numeric' : 
                          item.inspection_type === 'text' ? 'text' : 
                          item.inspection_type === 'multi_choice' ? 'multi_choice' : 'pass_fail',
                // Use sort_order as order_index
                order_index: item.sort_order || 0,
                // Include inspection record data if available
                inspection_record: record,
                status: record?.status || 'pending',
                inspected_at: record?.inspected_at,
                inspected_by: record?.inspected_by
              }
            })
            
            itpTemplates.push({
              ...template,
              itp_items: mappedItems,
              assignment: assignment, // Include the assignment details
              completion_percentage: assignment.status === 'completed' ? 100 : 
                                    inspectionRecords ? (inspectionRecords.filter((r: any) => r.status !== 'pending').length / items.length * 100) : 0
            })
            console.log('✅ Added template from assignment:', template.name, 'Status:', assignment.status)
          }
        }
      }
      
      // FALLBACK: Check legacy itp_id field if no templates in junction table
      if (itpTemplates.length === 0 && lot.itp_id) {
        console.log('📊 No junction table templates found, checking legacy itp_id:', lot.itp_id)
        
        const { data: legacyTemplate } = await supabase
          .from('itp_templates')
          .select('*')
          .eq('id', lot.itp_id)
          .single()
        
        if (legacyTemplate) {
          // Fetch items separately from itp_template_items table
          const { data: legacyItems } = await supabase
            .from('itp_template_items')
            .select('*')
            .eq('template_id', lot.itp_id)
            .order('sort_order')
          
          // Map items to expected format
          const mappedItems = (legacyItems || []).map((item: any) => ({
            ...item,
            // Map template_id to itp_template_id for consistency
            itp_template_id: item.template_id || legacyTemplate.id,
            // Determine item_type based on item_number field
            item_type: item.item_number === 'PASS_FAIL' ? 'pass_fail' : 
                      item.item_number === 'NUMERIC' ? 'numeric' : 
                      item.item_number === 'TEXT_INPUT' ? 'text' : 'pass_fail',
            // Use sort_order as order_index
            order_index: item.sort_order || 0,
            // Keep original fields
            inspection_method: item.inspection_method || 'Visual'
          }))
          
          itpTemplates.push({
            ...legacyTemplate,
            itp_items: mappedItems
          })
          console.log('✅ Added legacy template:', legacyTemplate.name)
        }
      }
      
      // For backward compatibility, set the first template as itp_template
      const primaryTemplate = itpTemplates.length > 0 ? itpTemplates[0] : undefined
      
      // Get all inspection records for this lot's assignments
      let conformanceRecords: any[] = []
      if (lotItpTemplates && lotItpTemplates.length > 0) {
        const assignmentIds = lotItpTemplates.map((a: any) => a.id)
        const { data: inspectionRecords } = await supabase
          .from('itp_inspection_records')
          .select('*')
          .in('assignment_id', assignmentIds)
        
        // Map to old conformance record format for backward compatibility
        conformanceRecords = inspectionRecords?.map((record: any) => ({
          id: record.id,
          lot_id: lotId,
          itp_item_id: record.template_item_id,
          result_pass_fail: record.status === 'pass' ? 'PASS' : record.status === 'fail' ? 'FAIL' : record.status.toUpperCase(),
          comments: record.comments,
          inspected_by: record.inspected_by,
          inspected_at: record.inspected_at,
          created_at: record.created_at,
          updated_at: record.updated_at
        })) || []
      }
      
      // Map to LotWithDetails format
      const lotWithDetails: LotWithDetails = {
        ...lot,
        project: lot.project,
        itp_template: primaryTemplate,  // Legacy support
        itp_templates: itpTemplates,     // New multiple templates
        lot_itp_assignments: lotItpTemplates || [], // New name
        lot_itp_templates: lotItpTemplates || [], // Keep for backward compatibility
        conformance_records: conformanceRecords || []
      }
      
      console.log('✅ Fetched lot from Supabase with', itpTemplates.length, 'ITP templates')
      console.log('📊 Final lot data being returned:', {
        lotId: lotWithDetails.id,
        itpTemplatesCount: lotWithDetails.itp_templates?.length,
        lotItpTemplatesCount: lotWithDetails.lot_itp_templates?.length,
        hasItpTemplate: !!lotWithDetails.itp_template
      })
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

      // Note: In the real schema, templates have template_items, not itp_items
      // For mock data compatibility, we'll skip creating items here
      // since mock data doesn't have a separate template items collection
      if (data.template_items && data.template_items.length > 0) {
        console.log(`Template created with ${data.template_items.length} template items (mock data doesn't store these separately)`)
      }

      return { success: true, data: newTemplate, message: 'ITP template created successfully' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to create ITP template' }
  }
}

// ==================== CONFORMANCE RECORD ACTIONS ====================

export async function saveConformanceRecordAction(
  assignmentId: number | string, 
  templateItemId: number | string, 
  data: UpdateConformanceRequest
): Promise<APIResponse<ConformanceRecord>> {
  console.log('🚀 saveConformanceRecordAction called with:', {
    assignmentId,
    templateItemId,
    data,
    timestamp: new Date().toISOString()
  })
  
  try {
    const user = await requireAuth()
    
    console.log('saveConformanceRecordAction: User authenticated:', user.email)
    
    // Check if we're working with mock data (numeric IDs)
    const isNumericAssignmentId = typeof assignmentId === 'number' || (!isNaN(Number(assignmentId)) && Number(assignmentId) < 1000)
    const isNumericItemId = typeof templateItemId === 'number' || (!isNaN(Number(templateItemId)) && Number(templateItemId) < 1000)
    const isMockData = isNumericAssignmentId || isNumericItemId
    
    console.log('📊 ID type detection:', {
      assignmentId,
      templateItemId,
      isNumericAssignmentId,
      isNumericItemId,
      isMockData
    })
    
    // Try to detect if this assignment exists in Supabase first
    let shouldUseMockData = isMockData
    if (isSupabaseEnabled && supabase && !isMockData) {
      // Check if this assignment actually exists in Supabase
      const { data: assignmentCheck, error: assignmentCheckError } = await supabase
        .from('lot_itp_assignments')
        .select('id')
        .eq('id', String(assignmentId))
        .single()
      
      if (assignmentCheckError || !assignmentCheck) {
        console.log('📊 Assignment not found in Supabase, falling back to mock data')
        shouldUseMockData = true
      }
    }
    
    if (isSupabaseEnabled && supabase && !shouldUseMockData) {
      console.log('📊 Saving inspection record in Supabase...')
      
      // Convert numeric IDs to strings for Supabase (which uses UUIDs)
      const assignmentIdStr = String(assignmentId)
      const templateItemIdStr = String(templateItemId)
      
      console.log('📊 Checking for existing record with IDs:', { assignmentIdStr, templateItemIdStr })
      
      // Verify this is a valid template item
      const { data: templateItemCheck } = await supabase
        .from('itp_template_items')
        .select('id, inspection_type')
        .eq('id', templateItemIdStr)
        .single()
      
      if (!templateItemCheck) {
        console.error('❌ Template item not found:', templateItemIdStr)
        return { success: false, error: 'Template item not found' }
      }
      
      // Check if inspection record exists
      const { data: existing, error: existingError } = await supabase
        .from('itp_inspection_records')
        .select('id')
        .eq('assignment_id', assignmentIdStr)
        .eq('template_item_id', templateItemIdStr)
        .single()
      
      if (existingError && existingError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine
        console.error('Error checking existing record:', existingError)
      }
      
      // Map the old data format to new inspection record format
      const recordData: any = {
        assignment_id: assignmentIdStr,
        template_item_id: templateItemIdStr,
        status: data.result_pass_fail === 'PASS' ? 'pass' : 
                data.result_pass_fail === 'FAIL' ? 'fail' : 
                data.result_pass_fail === 'NA' ? 'na' : 'pending',
        comments: data.comments || data.result_text || null,
        inspected_by: user.id,
        inspected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_non_conforming: data.result_pass_fail === 'FAIL'
      }
      
      // Set result based on inspection type
      switch (templateItemCheck.inspection_type) {
        case 'boolean':
          recordData.result_boolean = data.result_pass_fail === 'PASS'
          break
        case 'numeric':
          recordData.result_numeric = data.result_numeric
          break
        case 'text':
          recordData.result_text = data.result_text || data.comments
          break
        case 'multi_choice':
          recordData.result_choice = data.result_pass_fail
          break
      }
      
      let result;
      if (existing) {
        // Update existing record
        const { data: updated, error } = await supabase
          .from('itp_inspection_records')
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
          .from('itp_inspection_records')
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
      
      console.log('✅ Inspection record saved in Supabase')
      
      // Get the lot ID for revalidation
      const { data: assignment } = await supabase
        .from('lot_itp_assignments')
        .select('lot_id')
        .eq('id', assignmentIdStr)
        .single()
      
      // Transform the result to match expected interface for backward compatibility
      const transformedResult = {
        id: result.id,
        lot_id: assignment?.lot_id || '',
        itp_item_id: result.template_item_id,
        result_pass_fail: result.status === 'pass' ? 'PASS' : 
                         result.status === 'fail' ? 'FAIL' : 
                         result.status === 'na' ? 'NA' : 'PENDING',
        result_numeric: result.result_numeric,
        result_text: result.result_text,
        comments: result.comments,
        is_non_conformance: result.is_non_conforming,
        corrective_action: data.corrective_action,
        inspector_id: result.inspected_by,
        inspection_date: result.inspected_at,
        created_at: result.created_at,
        updated_at: result.updated_at
      }
      
      if (assignment?.lot_id) {
        revalidatePath(`/project/*/lot/${assignment.lot_id}`)
      }
      
      // Create non-conformance if needed
      if (result.is_non_conforming && result.status === 'fail') {
        console.log('🚨 Creating non-conformance for failed inspection')
        // This would call a separate function to create NC
      }
      
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
    console.log('📊 Lot ID type:', typeof data.lot_id, 'Value:', data.lot_id)
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (isSupabaseEnabled && !uuidRegex.test(String(data.lot_id))) {
      console.error('❌ Invalid UUID format for lot_id:', data.lot_id)
      return { success: false, error: 'Invalid lot ID format. Expected UUID but got: ' + data.lot_id }
    }
    
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
          rate_at_time_of_entry: data.rate_at_time_of_entry || data.hourly_rate || null,
          cost_code: data.cost_code || null,
          subcontractor_employee_id: data.subcontractor_employee_id || null,
          subcontractor_id: data.subcontractor_id || null,
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
    console.log('📊 Plant Lot ID type:', typeof data.lot_id, 'Value:', data.lot_id)
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (isSupabaseEnabled && !uuidRegex.test(String(data.lot_id))) {
      console.error('❌ Invalid UUID format for lot_id:', data.lot_id)
      return { success: false, error: 'Invalid lot ID format. Expected UUID but got: ' + data.lot_id }
    }
    
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
          rate_at_time_of_entry: data.rate_at_time_of_entry || data.hourly_rate || null,
          cost_code: data.cost_code || null,
          plant_profile_id: data.plant_profile_id || null,
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

// ==================== RESOURCE MANAGEMENT ACTIONS ====================

// Company actions
export async function getCompaniesAction(type?: 'subcontractor' | 'plant_supplier' | 'both'): Promise<APIResponse<Company[]>> {
  try {
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      let query = supabase
        .from('companies')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
      
      if (type) {
        query = query.or(`company_type.eq.${type},company_type.eq.both`)
      }
      
      const { data: companies, error } = await query.order('company_name')
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: companies || [] }
    } else {
      // Mock implementation
      // For now, return empty array as we haven't added mock companies yet
      return { success: true, data: [] }
    }
  } catch (error) {
    console.error('Get companies error:', error)
    return { success: false, error: 'Failed to fetch companies' }
  }
}

export async function createCompanyAction(data: CreateCompanyRequest): Promise<APIResponse<Company>> {
  try {
    console.log('createCompanyAction: Starting with data:', data)
    const user = await requireAuth()
    console.log('createCompanyAction: User authenticated:', user.email)
    
    const organizationId = await getUserOrganizationId(user.id)
    console.log('createCompanyAction: Organization ID:', organizationId)
    
    if (!organizationId) {
      console.error('createCompanyAction: No organization ID found')
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const insertData = {
        ...data,
        organization_id: organizationId,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString()
      }
      console.log('createCompanyAction: Inserting company with data:', insertData)
      
      const { data: company, error } = await supabase
        .from('companies')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('createCompanyAction: Database error:', error)
        console.error('createCompanyAction: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return { success: false, error: error.message }
      }
      
      console.log('createCompanyAction: Company created successfully:', company)
      revalidatePath('/dashboard/resources')
      return { success: true, data: company, message: 'Company created successfully' }
    } else {
      // Mock implementation
      const newCompany: Company = {
        id: randomUUID(),
        organization_id: organizationId,
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('createCompanyAction: Mock company created:', newCompany)
      return { success: true, data: newCompany, message: 'Company created successfully' }
    }
  } catch (error) {
    console.error('createCompanyAction: Caught error:', error)
    return { success: false, error: 'Failed to create company' }
  }
}

export async function updateCompanyAction(id: string, data: Partial<CreateCompanyRequest>): Promise<APIResponse<Company>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data: company, error } = await supabase
        .from('companies')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: company, message: 'Company updated successfully' }
    } else {
      return { success: false, error: 'Update not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Update company error:', error)
    return { success: false, error: 'Failed to update company' }
  }
}

export async function deleteCompanyAction(id: string): Promise<APIResponse<void>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('companies')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, message: 'Company deleted successfully' }
    } else {
      return { success: false, error: 'Delete not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Delete company error:', error)
    return { success: false, error: 'Failed to delete company' }
  }
}

// Subcontractor actions
export async function getSubcontractorsAction(): Promise<APIResponse<Subcontractor[]>> {
  try {
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const { data: subcontractors, error } = await supabase
        .from('subcontractors')
        .select('*')
        .eq('organization_id', organizationId)
        .order('company_name')
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: subcontractors || [] }
    } else {
      // Mock implementation
      // For now, return empty array as we haven't added mock subcontractors yet
      return { success: true, data: [] }
    }
  } catch (error) {
    console.error('Get subcontractors error:', error)
    return { success: false, error: 'Failed to fetch subcontractors' }
  }
}

export async function createSubcontractorAction(data: CreateSubcontractorRequest): Promise<APIResponse<Subcontractor>> {
  try {
    console.log('createSubcontractorAction: Starting with data:', data)
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    console.log('createSubcontractorAction: Organization ID:', organizationId)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const insertData = {
        ...data,
        organization_id: organizationId,
        created_at: new Date().toISOString()
      }
      console.log('createSubcontractorAction: Inserting with data:', insertData)
      
      const { data: subcontractor, error } = await supabase
        .from('subcontractors')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        console.error('createSubcontractorAction: Database error:', error)
        console.error('createSubcontractorAction: Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        return { success: false, error: error.message }
      }
      
      console.log('createSubcontractorAction: Created successfully:', subcontractor)
      revalidatePath('/dashboard/resources')
      return { success: true, data: subcontractor, message: 'Subcontractor created successfully' }
    } else {
      // Mock implementation
      const newSubcontractor: Subcontractor = {
        id: randomUUID(),
        organization_id: organizationId,
        ...data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return { success: true, data: newSubcontractor, message: 'Subcontractor created successfully' }
    }
  } catch (error) {
    console.error('Create subcontractor error:', error)
    return { success: false, error: 'Failed to create subcontractor' }
  }
}

export async function updateSubcontractorAction(id: string, data: Partial<CreateSubcontractorRequest>): Promise<APIResponse<Subcontractor>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data: subcontractor, error } = await supabase
        .from('subcontractors')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: subcontractor, message: 'Subcontractor updated successfully' }
    } else {
      return { success: false, error: 'Update not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Update subcontractor error:', error)
    return { success: false, error: 'Failed to update subcontractor' }
  }
}

export async function deleteSubcontractorAction(id: string): Promise<APIResponse<void>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('subcontractors')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, message: 'Subcontractor deleted successfully' }
    } else {
      return { success: false, error: 'Delete not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Delete subcontractor error:', error)
    return { success: false, error: 'Failed to delete subcontractor' }
  }
}

// Subcontractor Employee actions
export async function getSubcontractorEmployeesAction(subcontractorId?: string): Promise<APIResponse<SubcontractorEmployee[]>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      let query = supabase
        .from('subcontractor_employees')
        .select('*')
        .eq('is_active', true)
        .order('employee_name')
      
      if (subcontractorId) {
        query = query.eq('subcontractor_id', subcontractorId)
      }
      
      const { data: employees, error } = await query
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: employees || [] }
    } else {
      return { success: true, data: [] }
    }
  } catch (error) {
    console.error('Get subcontractor employees error:', error)
    return { success: false, error: 'Failed to fetch employees' }
  }
}

export async function createSubcontractorEmployeeAction(data: CreateSubcontractorEmployeeRequest): Promise<APIResponse<SubcontractorEmployee>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data: employee, error } = await supabase
        .from('subcontractor_employees')
        .insert({
          ...data,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: employee, message: 'Employee created successfully' }
    } else {
      const newEmployee: SubcontractorEmployee = {
        id: randomUUID(),
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return { success: true, data: newEmployee, message: 'Employee created successfully' }
    }
  } catch (error) {
    console.error('Create subcontractor employee error:', error)
    return { success: false, error: 'Failed to create employee' }
  }
}

export async function updateSubcontractorEmployeeAction(id: string, data: Partial<CreateSubcontractorEmployeeRequest>): Promise<APIResponse<SubcontractorEmployee>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data: employee, error } = await supabase
        .from('subcontractor_employees')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: employee, message: 'Employee updated successfully' }
    } else {
      return { success: false, error: 'Update not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Update subcontractor employee error:', error)
    return { success: false, error: 'Failed to update employee' }
  }
}

// Plant Profile actions
export async function getPlantProfilesAction(): Promise<APIResponse<PlantProfile[]>> {
  try {
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const { data: profiles, error } = await supabase
        .from('plant_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('machine_name')
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: profiles || [] }
    } else {
      return { success: true, data: [] }
    }
  } catch (error) {
    console.error('Get plant profiles error:', error)
    return { success: false, error: 'Failed to fetch plant profiles' }
  }
}

export async function createPlantProfileAction(data: CreatePlantProfileRequest): Promise<APIResponse<PlantProfile>> {
  try {
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const { data: profile, error } = await supabase
        .from('plant_profiles')
        .insert({
          ...data,
          organization_id: organizationId,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: profile, message: 'Plant profile created successfully' }
    } else {
      const newProfile: PlantProfile = {
        id: randomUUID(),
        organization_id: organizationId,
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return { success: true, data: newProfile, message: 'Plant profile created successfully' }
    }
  } catch (error) {
    console.error('Create plant profile error:', error)
    return { success: false, error: 'Failed to create plant profile' }
  }
}

export async function updatePlantProfileAction(id: string, data: Partial<CreatePlantProfileRequest>): Promise<APIResponse<PlantProfile>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data: profile, error } = await supabase
        .from('plant_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: profile, message: 'Plant profile updated successfully' }
    } else {
      return { success: false, error: 'Update not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Update plant profile error:', error)
    return { success: false, error: 'Failed to update plant profile' }
  }
}

export async function deletePlantProfileAction(id: string): Promise<APIResponse<void>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('plant_profiles')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, message: 'Plant profile deleted successfully' }
    } else {
      return { success: false, error: 'Delete not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Delete plant profile error:', error)
    return { success: false, error: 'Failed to delete plant profile' }
  }
}

// Material Profile actions
export async function getMaterialProfilesAction(): Promise<APIResponse<MaterialProfile[]>> {
  try {
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const { data: profiles, error } = await supabase
        .from('material_profiles')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('material_name')
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: profiles || [] }
    } else {
      return { success: true, data: [] }
    }
  } catch (error) {
    console.error('Get material profiles error:', error)
    return { success: false, error: 'Failed to fetch material profiles' }
  }
}

export async function createMaterialProfileAction(data: CreateMaterialProfileRequest): Promise<APIResponse<MaterialProfile>> {
  try {
    const user = await requireAuth()
    const organizationId = await getUserOrganizationId(user.id)
    
    if (!organizationId) {
      return { success: false, error: 'User organization not found' }
    }
    
    if (isSupabaseEnabled && supabase) {
      const { data: profile, error } = await supabase
        .from('material_profiles')
        .insert({
          ...data,
          organization_id: organizationId,
          is_active: data.is_active ?? true,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: profile, message: 'Material profile created successfully' }
    } else {
      const newProfile: MaterialProfile = {
        id: randomUUID(),
        organization_id: organizationId,
        ...data,
        is_active: data.is_active ?? true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      return { success: true, data: newProfile, message: 'Material profile created successfully' }
    }
  } catch (error) {
    console.error('Create material profile error:', error)
    return { success: false, error: 'Failed to create material profile' }
  }
}

export async function updateMaterialProfileAction(id: string, data: Partial<CreateMaterialProfileRequest>): Promise<APIResponse<MaterialProfile>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data: profile, error } = await supabase
        .from('material_profiles')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, data: profile, message: 'Material profile updated successfully' }
    } else {
      return { success: false, error: 'Update not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Update material profile error:', error)
    return { success: false, error: 'Failed to update material profile' }
  }
}

export async function deleteMaterialProfileAction(id: string): Promise<APIResponse<void>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { error } = await supabase
        .from('material_profiles')
        .delete()
        .eq('id', id)
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      revalidatePath('/dashboard/resources')
      return { success: true, message: 'Material profile deleted successfully' }
    } else {
      return { success: false, error: 'Delete not implemented in mock mode' }
    }
  } catch (error) {
    console.error('Delete material profile error:', error)
    return { success: false, error: 'Failed to delete material profile' }
  }
}

// Project Cost Summary action
export async function getProjectCostSummaryAction(
  projectId: string,
  startDate: string,
  endDate: string
): Promise<APIResponse<ProjectCostSummary>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .rpc('get_project_cost_summary', {
          p_project_id: projectId,
          p_start_date: startDate,
          p_end_date: endDate
        })
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: data as ProjectCostSummary }
    } else {
      // Mock implementation - calculate from mock data
      const mockSummary: ProjectCostSummary = {
        project_id: projectId,
        start_date: startDate,
        end_date: endDate,
        total_cost: 125650,
        labour: {
          total_cost: 45200,
          days_worked: 15,
          entries: 32,
          details: [
            {
              date: '2024-01-15',
              worker: 'John Smith',
              subcontractor: 'ABC Construction',
              hours: 8,
              overtime_hours: 2,
              rate: 45,
              cost: 450,
              lot: 'LOT-001',
              description: 'Foundation work'
            }
          ]
        },
        plant: {
          total_cost: 38750,
          days_used: 12,
          entries: 18,
          details: [
            {
              date: '2024-01-15',
              equipment: 'Excavator CAT 320',
              supplier: 'Heavy Equipment Co',
              hours: 8,
              idle_hours: 1,
              rate: 150,
              cost: 1350,
              lot: 'LOT-001',
              description: 'Site excavation'
            }
          ]
        },
        materials: {
          total_cost: 41700,
          delivery_days: 8,
          entries: 15,
          details: [
            {
              date: '2024-01-15',
              material: 'Concrete 32MPa',
              supplier: 'Ready Mix Co',
              quantity: 25,
              unit: 'm3',
              rate: 280,
              cost: 7000,
              lot: 'LOT-001',
              docket: 'DEL-2024-0123'
            }
          ]
        }
      }
      
      return { success: true, data: mockSummary }
    }
  } catch (error) {
    console.error('Get project cost summary error:', error)
    return { success: false, error: 'Failed to fetch cost summary' }
  }
}

// Get detailed labour costs for a project
export async function getProjectLabourCostsAction(
  projectId: string,
  startDate?: string,
  endDate?: string,
  lotId?: string
): Promise<APIResponse<any[]>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      let query = supabase
        .from('v_labour_costs')
        .select('*')
        .eq('project_id', projectId)
        .order('work_date', { ascending: false })
      
      if (startDate) {
        query = query.gte('work_date', startDate)
      }
      if (endDate) {
        query = query.lte('work_date', endDate)
      }
      if (lotId) {
        query = query.eq('lot_id', lotId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: data || [] }
    } else {
      // Mock implementation
      const mockLabourData = [
        {
          id: '1',
          lot_id: '1',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-001',
          work_date: '2024-01-15',
          worker_name: 'John Smith',
          subcontractor_name: 'ABC Construction',
          trade: 'Carpenter',
          hours_worked: 8,
          overtime_hours: 2,
          rate_at_time_of_entry: 45,
          total_cost: 450,
          cost_code: 'LAB-001',
          task_description: 'Foundation formwork'
        },
        {
          id: '2',
          lot_id: '1',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-001',
          work_date: '2024-01-16',
          worker_name: 'Mike Johnson',
          subcontractor_name: 'ABC Construction',
          trade: 'Electrician',
          hours_worked: 8,
          overtime_hours: 0,
          rate_at_time_of_entry: 55,
          total_cost: 440,
          cost_code: 'LAB-002',
          task_description: 'Electrical rough-in'
        },
        {
          id: '3',
          lot_id: '2',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-002',
          work_date: '2024-01-17',
          worker_name: 'Sarah Davis',
          subcontractor_name: 'XYZ Plumbing',
          trade: 'Plumber',
          hours_worked: 6,
          overtime_hours: 0,
          rate_at_time_of_entry: 50,
          total_cost: 300,
          cost_code: 'LAB-003',
          task_description: 'Pipe installation'
        }
      ]
      
      let filteredData = mockLabourData
      if (lotId) {
        filteredData = filteredData.filter(item => item.lot_id === lotId)
      }
      if (startDate) {
        filteredData = filteredData.filter(item => item.work_date >= startDate)
      }
      if (endDate) {
        filteredData = filteredData.filter(item => item.work_date <= endDate)
      }
      
      return { success: true, data: filteredData }
    }
  } catch (error) {
    console.error('Get project labour costs error:', error)
    return { success: false, error: 'Failed to fetch labour costs' }
  }
}

// Get detailed plant costs for a project
export async function getProjectPlantCostsAction(
  projectId: string,
  startDate?: string,
  endDate?: string,
  lotId?: string
): Promise<APIResponse<any[]>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      let query = supabase
        .from('v_plant_costs')
        .select('*')
        .eq('project_id', projectId)
        .order('work_date', { ascending: false })
      
      if (startDate) {
        query = query.gte('work_date', startDate)
      }
      if (endDate) {
        query = query.lte('work_date', endDate)
      }
      if (lotId) {
        query = query.eq('lot_id', lotId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: data || [] }
    } else {
      // Mock implementation
      const mockPlantData = [
        {
          id: '1',
          lot_id: '1',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-001',
          work_date: '2024-01-15',
          equipment_type: 'Excavator',
          machine_name: 'CAT 320',
          supplier: 'Heavy Equipment Co',
          hours_used: 8,
          idle_hours: 1,
          rate_at_time_of_entry: 150,
          total_cost: 1350,
          cost_code: 'PLT-001',
          task_description: 'Site excavation'
        },
        {
          id: '2',
          lot_id: '1',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-001',
          work_date: '2024-01-16',
          equipment_type: 'Crane',
          machine_name: 'Grove GMK3060',
          supplier: 'Heavy Equipment Co',
          hours_used: 6,
          idle_hours: 2,
          rate_at_time_of_entry: 250,
          total_cost: 2000,
          cost_code: 'PLT-002',
          task_description: 'Steel beam installation'
        },
        {
          id: '3',
          lot_id: '2',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-002',
          work_date: '2024-01-17',
          equipment_type: 'Concrete Pump',
          machine_name: 'Putzmeister M42',
          supplier: 'Concrete Equipment Ltd',
          hours_used: 4,
          idle_hours: 0,
          rate_at_time_of_entry: 180,
          total_cost: 720,
          cost_code: 'PLT-003',
          task_description: 'Slab pour'
        }
      ]
      
      let filteredData = mockPlantData
      if (lotId) {
        filteredData = filteredData.filter(item => item.lot_id === lotId)
      }
      if (startDate) {
        filteredData = filteredData.filter(item => item.work_date >= startDate)
      }
      if (endDate) {
        filteredData = filteredData.filter(item => item.work_date <= endDate)
      }
      
      return { success: true, data: filteredData }
    }
  } catch (error) {
    console.error('Get project plant costs error:', error)
    return { success: false, error: 'Failed to fetch plant costs' }
  }
}

// Get detailed material costs for a project
export async function getProjectMaterialCostsAction(
  projectId: string,
  startDate?: string,
  endDate?: string,
  lotId?: string
): Promise<APIResponse<any[]>> {
  try {
    await requireAuth()
    
    if (isSupabaseEnabled && supabase) {
      let query = supabase
        .from('v_material_costs')
        .select('*')
        .eq('project_id', projectId)
        .order('delivery_date', { ascending: false })
      
      if (startDate) {
        query = query.gte('delivery_date', startDate)
      }
      if (endDate) {
        query = query.lte('delivery_date', endDate)
      }
      if (lotId) {
        query = query.eq('lot_id', lotId)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('Database error:', error)
        return { success: false, error: error.message }
      }
      
      return { success: true, data: data || [] }
    } else {
      // Mock implementation
      const mockMaterialData = [
        {
          id: '1',
          lot_id: '1',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-001',
          delivery_date: '2024-01-15',
          material_type: 'Concrete',
          material_name: 'Concrete 32MPa',
          profile_supplier: 'Ready Mix Co',
          delivery_supplier: 'Ready Mix Co',
          quantity: 25,
          unit_measure: 'm3',
          rate_at_time_of_entry: 280,
          total_cost: 7000,
          cost_code: 'MAT-001',
          delivery_docket: 'DEL-2024-0123'
        },
        {
          id: '2',
          lot_id: '1',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-001',
          delivery_date: '2024-01-16',
          material_type: 'Steel',
          material_name: 'Rebar 16mm',
          profile_supplier: 'Steel Supplies Ltd',
          delivery_supplier: 'Steel Supplies Ltd',
          quantity: 5,
          unit_measure: 'tonnes',
          rate_at_time_of_entry: 950,
          total_cost: 4750,
          cost_code: 'MAT-002',
          delivery_docket: 'DEL-2024-0124'
        },
        {
          id: '3',
          lot_id: '2',
          project_id: projectId,
          project_name: 'Test Project',
          lot_number: 'LOT-002',
          delivery_date: '2024-01-17',
          material_type: 'Aggregate',
          material_name: 'Crushed Rock 20mm',
          profile_supplier: 'Quarry Products',
          delivery_supplier: 'Quarry Products',
          quantity: 30,
          unit_measure: 'tonnes',
          rate_at_time_of_entry: 45,
          total_cost: 1350,
          cost_code: 'MAT-003',
          delivery_docket: 'DEL-2024-0125'
        }
      ]
      
      let filteredData = mockMaterialData
      if (lotId) {
        filteredData = filteredData.filter(item => item.lot_id === lotId)
      }
      if (startDate) {
        filteredData = filteredData.filter(item => item.delivery_date >= startDate)
      }
      if (endDate) {
        filteredData = filteredData.filter(item => item.delivery_date <= endDate)
      }
      
      return { success: true, data: filteredData }
    }
  } catch (error) {
    console.error('Get project material costs error:', error)
    return { success: false, error: 'Failed to fetch material costs' }
  }
}