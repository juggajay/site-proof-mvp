import { createClient } from '../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import { ProjectClientPage } from './client-page'
import type { Project, LotWithItp } from '../../../types'

interface PageProps {
  params: { projectId: string }
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const supabase = createClient()

  // Fetch project details
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.projectId)
    .single<Project>()

  if (projectError || !project) {
    notFound()
  }

  // Fetch lots for this project with ITP information
  const { data: lots, error: lotsError } = await supabase
    .from('lots')
    .select(`
      *,
      itps (
        title
      )
    `)
    .eq('project_id', params.projectId)
    .order('created_at', { ascending: false })

  if (lotsError) {
    console.error('Error fetching lots:', lotsError)
  }

  return <ProjectClientPage project={project} lots={lots as LotWithItp[] ?? []} />
}