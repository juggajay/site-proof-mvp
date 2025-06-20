'use server'

import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'
import { 
  User, Profile, Organization, Project, Lot, ITPTemplate, ITPItem, 
  ConformanceRecord, Attachment, InspectionReport, NonConformance,
  ProjectWithDetails, LotWithDetails, ITPTemplateWithItems,
  CreateProjectRequest, CreateLotRequest, CreateITPTemplateRequest,
  UpdateConformanceRequest, APIResponse, ProjectStats, InspectionSummary,
  DailyReport, DailyEvent, DailyLabour, DailyPlant, DailyMaterials,
  CreateDailyReportRequest, CreateDailyEventRequest, CreateDailyLabourRequest,
  CreateDailyPlantRequest, CreateDailyMaterialsRequest
} from '@/types/database'

// Import shared mock database storage
import { 
  mockUsers, mockProfiles, mockOrganizations, mockProjects, mockLots,
  mockITPTemplates, mockITPItems, mockConformanceRecords, mockAttachments,
  mockReports, mockNonConformances, mockDailyReports, mockDailyEvents,
  mockDailyLabour, mockDailyPlant, mockDailyMaterials
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
    const projectData = {
      name,
      project_number: projectNumber || undefined,
      description: description || undefined,
      location: location || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: 'active' as const
      // Note: organization_id, created_by, project_manager_id removed for Supabase compatibility
    }
    
    console.log('🚀 createProjectAction: Calling createProject with data:', JSON.stringify(projectData, null, 2))
    const result = await createProject(projectData)
    
    if (result.success) {
      console.log('=== PROJECT CREATION SUCCESS ===')
      console.log('createProjectAction: Created new project with ID:', result.data!.id)
      revalidatePath('/dashboard')
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
    
    const projectIdStr = formData.get('projectId') as string
    const projectId = isNaN(parseInt(projectIdStr)) ? projectIdStr : parseInt(projectIdStr)
    const lotNumber = formData.get('lotNumber') as string
    const description = formData.get('description') as string
    const locationDescription = formData.get('locationDescription') as string

    if (!projectId || !lotNumber) {
      return { success: false, error: 'Project ID and lot number are required' }
    }

    if (isSupabaseEnabled && supabase) {
      console.log('📊 Creating lot in Supabase...')
      
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
          description: description || null,
          location_description: locationDescription || null,
          status: 'pending',
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
    await requireAuth()
    
    console.log('assignITPToLotAction: Assigning template', itpTemplateId, 'to lot', lotId)
    
    const lotIndex = mockLots.findIndex(l => compareIds(l.id, lotId))
    if (lotIndex === -1) {
      console.log('assignITPToLotAction: Lot not found for ID:', lotId)
      return { success: false, error: 'Lot not found' }
    }

    const itpTemplate = mockITPTemplates.find(t => compareIds(t.id, itpTemplateId))
    if (!itpTemplate) {
      console.log('assignITPToLotAction: ITP template not found for ID:', itpTemplateId)
      console.log('assignITPToLotAction: Available templates:', mockITPTemplates.map(t => ({ id: t.id, name: t.name })))
      return { success: false, error: 'ITP template not found' }
    }
    
    console.log('assignITPToLotAction: Successfully found lot and template')

    mockLots[lotIndex] = {
      ...mockLots[lotIndex],
      itp_template_id: itpTemplateId,
      status: 'in_progress',
      updated_at: new Date().toISOString()
    }

    const updatedLot = mockLots[lotIndex]
    console.log('assignITPToLotAction: Successfully assigned ITP template to lot')
    revalidatePath(`/project/${updatedLot.project_id}`)
    return { success: true, data: mockLots[lotIndex], message: 'ITP assigned successfully' }
  } catch (error) {
    return { success: false, error: 'Failed to assign ITP' }
  }
}

export async function getLotByIdAction(lotId: number | string): Promise<APIResponse<LotWithDetails>> {
  try {
    await requireAuth()
    
    console.log('getLotByIdAction: Looking for lot with ID:', lotId, 'type:', typeof lotId)
    console.log('getLotByIdAction: Available lots:', mockLots.map(l => ({ id: l.id, type: typeof l.id, lot_number: l.lot_number })))
    
    const lot = mockLots.find(l => compareIds(l.id, lotId))
    if (!lot) {
      console.log('getLotByIdAction: Lot not found for ID:', lotId)
      return { success: false, error: 'Lot not found' }
    }

    console.log('getLotByIdAction: Found lot:', lot.lot_number)
    const project = mockProjects.find(p => compareIds(p.id, lot.project_id))!
    const itpTemplate = lot.itp_template_id ? mockITPTemplates.find(t => compareIds(t.id, lot.itp_template_id!)) : undefined
    const itpItems = itpTemplate ? mockITPItems.filter(i => compareIds(i.itp_template_id, itpTemplate.id)) : []
    const conformanceRecords = mockConformanceRecords.filter(c => compareIds(c.lot_id, lotId))
    
    console.log('getLotByIdAction: Found ITP template:', itpTemplate?.name || 'None')
    console.log('getLotByIdAction: Found ITP items:', itpItems.length)
    console.log('getLotByIdAction: Found conformance records:', conformanceRecords.length)

    const lotWithDetails: LotWithDetails = {
      ...lot,
      project,
      itp_template: itpTemplate ? { ...itpTemplate, itp_items: itpItems } : undefined,
      assigned_inspector: lot.assigned_inspector_id ? mockProfiles.find(p => p.user_id === lot.assigned_inspector_id) : undefined,
      conformance_records: conformanceRecords.map(record => ({
        ...record,
        itp_item: itpItems.find(item => item.id === record.itp_item_id)!,
        attachments: mockAttachments.filter(a => a.conformance_record_id === record.id)
      }))
    }

    return { success: true, data: lotWithDetails }
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
      const { data, error } = await supabase
        .from('itp_templates')
        .select('*')
        .eq('is_active', true)
        .order('name')
      
      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }
      
      console.log('✅ Fetched ITP templates from Supabase:', data?.length || 0)
      return { success: true, data: data || [] }
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
      console.log('📊 Fetching ITP template with items from Supabase...')
      const { data: template, error: templateError } = await supabase
        .from('itp_templates')
        .select(`
          *,
          organization:organizations(*),
          itp_items(*)
        `)
        .eq('id', templateId)
        .single()
      
      if (templateError) {
        console.error('Supabase error:', templateError)
        return { success: false, error: templateError.message }
      }
      
      if (!template) {
        return { success: false, error: 'ITP template not found' }
      }
      
      console.log('✅ Fetched ITP template from Supabase')
      return { success: true, data: template as ITPTemplateWithItems }
    } else {
      console.log('📝 Fetching ITP template from mock data...')
      const template = mockITPTemplates.find(t => compareIds(t.id, templateId))
      if (!template) {
        return { success: false, error: 'ITP template not found' }
      }
      
      const items = mockITPItems.filter(item => compareIds(item.itp_template_id, templateId))
      
      // Get the organization for this template
      const organization = mockOrganizations.find(o => o.id === template.organization_id)
      if (!organization) {
        return { success: false, error: 'Organization not found for this template' }
      }
      
      const templateWithItems: ITPTemplateWithItems = {
        ...template,
        itp_items: items,
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
  try {
    const user = await requireAuth()
    
    console.log('saveConformanceRecordAction: Saving record for lot', lotId, 'item', itpItemId)
    
    if (isSupabaseEnabled && supabase) {
      console.log('📊 Saving conformance record in Supabase...')
      
      // Check if record exists
      const { data: existing } = await supabase
        .from('conformance_records')
        .select('id')
        .eq('lot_id', lotId)
        .eq('itp_item_id', itpItemId)
        .single()
      
      const recordData = {
        lot_id: lotId,
        itp_item_id: itpItemId,
        result_pass_fail: data.result_pass_fail,
        result_numeric: data.result_numeric || null,
        result_text: data.result_text || null,
        comments: data.comments || null,
        is_non_conformance: data.result_pass_fail === 'FAIL',
        corrective_action: data.corrective_action || null,
        inspector_id: user.id,
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
          console.error('Supabase error:', error)
          return { success: false, error: error.message }
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
          console.error('Supabase error:', error)
          return { success: false, error: error.message }
        }
        result = inserted
      }
      
      console.log('✅ Conformance record saved in Supabase')
      revalidatePath(`/project/*/lot/${lotId}`)
      return { success: true, data: result, message: 'Inspection saved successfully' }
    } else {
      console.log('📝 Saving conformance record in mock data...')
      const existingIndex = mockConformanceRecords.findIndex(
        r => compareIds(r.lot_id, lotId) && compareIds(r.itp_item_id, itpItemId)
      )

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
        inspector_id: user.id,
        inspection_date: new Date().toISOString(),
        created_at: existingIndex >= 0 ? mockConformanceRecords[existingIndex].created_at : new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      if (existingIndex >= 0) {
        mockConformanceRecords[existingIndex] = recordData
      } else {
        mockConformanceRecords.push(recordData)
      }

      revalidatePath(`/project/*/lot/${lotId}`)
      return { success: true, data: recordData, message: 'Inspection saved successfully' }
    }
  } catch (error) {
    return { success: false, error: 'Failed to save inspection' }
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
      return { success: true, data: records || [] }
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