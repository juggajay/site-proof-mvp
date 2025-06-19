import { supabase, isSupabaseEnabled } from './supabase'
import { Project, ProjectWithDetails, Lot, APIResponse } from '@/types/database'
import { getCurrentDatabaseState, setDatabaseState } from './mock-fallback'

// Database abstraction layer that works with both Supabase and mock data

export async function createProject(projectData: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<APIResponse<Project>> {
  if (isSupabaseEnabled) {
    console.log('📊 Creating project in Supabase...')
    try {
      const { data, error } = await supabase!
        .from('projects')
        .insert([{
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Project created in Supabase:', data.id)
      return { success: true, data: data as Project }
    } catch (error) {
      console.error('Supabase error:', error)
      return { success: false, error: 'Failed to create project in database' }
    }
  } else {
    console.log('📝 Creating project in mock database...')
    // Fallback to mock data
    const state = await getCurrentDatabaseState()
    const newProject: Project = {
      id: crypto.randomUUID(),
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    state.projects.push(newProject)
    await setDatabaseState(state)
    
    return { success: true, data: newProject }
  }
}

export async function getProjects(): Promise<APIResponse<Project[]>> {
  if (isSupabaseEnabled) {
    console.log('📊 Fetching projects from Supabase...')
    try {
      const { data, error } = await supabase!
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Fetched projects from Supabase:', data.length)
      return { success: true, data: data as Project[] }
    } catch (error) {
      console.error('Supabase error:', error)
      return { success: false, error: 'Failed to fetch projects from database' }
    }
  } else {
    console.log('📝 Fetching projects from mock database...')
    // Fallback to mock data
    const state = await getCurrentDatabaseState()
    return { success: true, data: state.projects }
  }
}

export async function getProjectById(projectId: string | number): Promise<APIResponse<ProjectWithDetails>> {
  if (isSupabaseEnabled) {
    console.error('📊 Fetching project from Supabase:', projectId, typeof projectId)
    try {
      // First try to get just the project without joins to test basic query
      const { data: project, error: projectError } = await supabase!
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()
      
      console.error('📊 Basic project query result:', { project: !!project, error: projectError })
      
      console.error('📊 Supabase project query result:', { project: !!project, error: projectError })

      if (projectError) {
        console.error('Supabase project error:', projectError)
        return { success: false, error: 'Project not found' }
      }

      // For now, create a basic response without complex joins
      const projectWithDetails: ProjectWithDetails = {
        ...project,
        organization: {
          id: 1,
          name: "Default Organization",
          slug: "default-org",
          description: "Default organization",
          created_by: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        created_by_user: {
          id: 1,
          user_id: 1,
          first_name: "John",
          last_name: "Anderson",
          timezone: "UTC",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        project_manager: {
          id: 1,
          user_id: 1,
          first_name: "John",
          last_name: "Anderson",
          timezone: "UTC",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        lots: [], // TODO: fetch separately
        members: []
      }

      console.log('✅ Fetched project from Supabase:', project.id)
      return { success: true, data: projectWithDetails }
    } catch (error) {
      console.error('Supabase error:', error)
      return { success: false, error: 'Failed to fetch project from database' }
    }
  } else {
    console.log('📝 Fetching project from mock database:', projectId)
    // Fallback to mock data - use the existing logic from actions.ts
    const state = await getCurrentDatabaseState()
    
    const project = state.projects.find(p => 
      String(p.id) === String(projectId)
    )
    
    if (!project) {
      return { success: false, error: 'Project not found' }
    }

    const organization = state.organizations.find(o => o.id === project.organization_id)!
    const lots = state.lots.filter(l => String(l.project_id) === String(projectId))
    
    const projectWithDetails: ProjectWithDetails = {
      ...project,
      organization,
      created_by_user: state.profiles.find(p => p.user_id === project.created_by)!,
      project_manager: state.profiles.find(p => p.user_id === project.project_manager_id)!,
      members: [],
      lots
    }

    return { success: true, data: projectWithDetails }
  }
}