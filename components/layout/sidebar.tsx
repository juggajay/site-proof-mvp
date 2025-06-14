'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SiteProofLogo } from '../ui/site-proof-logo'
import { 
  LayoutDashboard, 
  FolderKanban, 
  ClipboardCheck, 
  FileText, 
  Settings,
  HelpCircle
} from 'lucide-react'
import { cn } from '../../lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Inspections', href: '/inspections', icon: ClipboardCheck },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help', href: '/help', icon: HelpCircle },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      {/* Logo in sidebar */}
      <div className="flex h-16 items-center border-b px-6">
        <SiteProofLogo size="sm" showText={true} />
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors font-primary',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}