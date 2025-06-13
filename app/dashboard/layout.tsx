import { createClient } from '../../lib/supabase/server'
import { redirect } from 'next/navigation'
import { Sidebar } from '../../components/layout/sidebar'
import { Header } from '../../components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-100/40">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}