import { createClient } from '../../../lib/supabase/server'
import { notFound } from 'next/navigation'
import ClientPage from './client-page'
import type { Project, LotWithItp } from '../../../types'

interface ProjectPageProps {
  params: {
    projectId: string
  }
}

export default async function ProjectPage({ params }: ProjectPageProps) {
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

  const lotsWithItp: LotWithItp[] = lots?.map(lot => ({
    ...lot,
    itps: lot.itps ? { title: lot.itps.title } : null
  })) || []

  return <ClientPage project={project} initialLots={lotsWithItp} />
}