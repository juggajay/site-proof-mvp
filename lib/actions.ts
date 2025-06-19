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
  UpdateConformanceRequest, APIResponse, ProjectStats, InspectionSummary
} from '@/types/database'

// Import shared mock database storage
import { 
  mockUsers, mockProfiles, mockOrganizations, mockProjects, mockLots,
  mockITPTemplates, mockITPItems, mockConformanceRecords, mockAttachments,
  mockReports, mockNonConformances
} from './mock-data'

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

    if (firstName || lastName) {
      await createProfileInDb(newUser.id, firstName, lastName)
    }

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
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Authentication required')
  }
  return user
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

    // Generate new string UUID for consistency with existing projects
    const newProject: Project = {
      id: randomUUID(),
      name,
      project_number: projectNumber || undefined,
      description: description || undefined,
      location: location || undefined,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      status: 'active',
      organization_id: 1, // Default organization
      created_by: user.id,
      project_manager_id: user.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockProjects.push(newProject)
    console.log('createProjectAction: Created new project with ID:', newProject.id, 'type:', typeof newProject.id)
    console.log('createProjectAction: Total projects after creation:', mockProjects.length)
    console.log('createProjectAction: All project IDs:', mockProjects.map(p => ({ id: p.id, type: typeof p.id, name: p.name })))
    revalidatePath('/dashboard')
    
    return { success: true, data: newProject, message: 'Project created successfully' }
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
    await requireAuth()
    console.log('getProjectsAction: Total projects available:', mockProjects.length)
    console.log('getProjectsAction: Project IDs:', mockProjects.map(p => ({ id: p.id, type: typeof p.id, name: p.name })))
    return { success: true, data: mockProjects }
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
  try {
    await requireAuth()
    
    console.log('=== getProjectByIdAction DEBUG START ===')
    console.log('getProjectByIdAction: Looking for project with ID:', projectId, 'type:', typeof projectId)
    console.log('getProjectByIdAction: mockProjects array length:', mockProjects.length)
    console.log('getProjectByIdAction: Available projects:', mockProjects.map(p => ({ id: p.id, type: typeof p.id, name: p.name })))
    
    // Test each comparison manually for debugging
    console.log('getProjectByIdAction: Testing ID comparisons:')
    mockProjects.forEach(p => {
      const matches = compareIds(p.id, projectId)
      console.log(`  Project ID ${p.id} (${typeof p.id}) vs search ${projectId} (${typeof projectId}) = ${matches}`)
    })
    
    const project = mockProjects.find(p => compareIds(p.id, projectId))
    if (!project) {
      console.log('getProjectByIdAction: Project not found for ID:', projectId)
      console.log('getProjectByIdAction: compareIds function test:', compareIds('test', 'test'), compareIds(1, '1'))
      return { success: false, error: 'Project not found' }
    }

    console.log('getProjectByIdAction: Found project:', project.name)
    const organization = mockOrganizations.find(o => o.id === project.organization_id)!
    const lots = mockLots.filter(l => compareIds(l.project_id, projectId))
    console.log('getProjectByIdAction: Found lots:', lots.length)

    const projectWithDetails: ProjectWithDetails = {
      ...project,
      organization,
      created_by_user: mockProfiles.find(p => p.user_id === project.created_by)!,
      project_manager: mockProfiles.find(p => p.user_id === project.project_manager_id)!,
      members: [],
      lots
    }

    return { success: true, data: projectWithDetails }
  } catch (error) {
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
    return { success: true, data: mockITPTemplates }
  } catch (error) {
    return { success: false, error: 'Failed to fetch ITP templates' }
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
  } catch (error) {
    return { success: false, error: 'Failed to save inspection' }
  }
}

export async function getConformanceRecordsAction(lotId: number | string): Promise<APIResponse<ConformanceRecord[]>> {
  try {
    await requireAuth()
    const records = mockConformanceRecords.filter(r => compareIds(r.lot_id, lotId))
    console.log('getConformanceRecordsAction: Found', records.length, 'records for lot', lotId)
    return { success: true, data: records }
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