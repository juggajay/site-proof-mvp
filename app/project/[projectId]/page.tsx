import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import ClientPage from './client-page'
import type { Project, LotWithItp } from '@/types'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const supabase = createClient()

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    notFound()
  }

  // Get the project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single()

  if (projectError || !project) {
    notFound()
  }

  // Get lots for this project with ITP information
  const { data: lots, error: lotsError } = await supabase
    .from('lots')
    .select(`
      *,
      itps:itp_id (
        title
      )
    `)
    .eq('project_id', params.projectId)
    .order('created_at', { ascending: false })

  if (lotsError) {
    console.error('Error fetching lots:', lotsError)
  }

  return (
    <ClientPage 
      project={project as Project} 
      initialLots={(lots as LotWithItp[]) || []} 
    />
  )
}