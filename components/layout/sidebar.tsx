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
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Logo in sidebar */}
      <div className="flex h-16 items-center border-b border-slate-200 px-6">
        <SiteProofLogo size="sm" showText={true} />
      </div>
      
      {/* Sidebar content */}
      <div className="flex-1 overflow-auto py-4">
        <nav className="flex-1 space-y-1 px-4">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors font-primary',
                  isActive
                    ? 'bg-blue-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-blue-800 hover:bg-slate-50'
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