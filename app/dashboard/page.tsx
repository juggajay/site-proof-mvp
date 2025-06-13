import { createClient } from '../../lib/supabase/server'
import { DashboardClientPage } from './client-page'
import { Project } from '../../types'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })

  return <DashboardClientPage projects={projects as Project[] ?? []} />
}