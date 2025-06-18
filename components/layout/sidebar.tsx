'use client'

import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  FolderOpen, 
  ClipboardList, 
  BarChart3, 
  Settings, 
  Users, 
  Building2,
  FileText,
  AlertTriangle,
  LogOut
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'ITP Templates', href: '/templates', icon: ClipboardList },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Non-Conformances', href: '/non-conformances', icon: AlertTriangle },
]

const settingsNavigation = [
  { name: 'Organization', href: '/settings/organization', icon: Building2 },
  { name: 'Users & Roles', href: '/settings/users', icon: Users },
  { name: 'System Settings', href: '/settings/system', icon: Settings },
  { name: 'Documentation', href: '/settings/docs', icon: FileText },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900">
      {/* Logo and title */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Building2 className="h-8 w-8 text-white" />
        <span className="ml-3 text-xl font-bold text-white">Site Proof</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={classNames(
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Settings section */}
        <div className="mt-8">
          <h3 className="px-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Settings
          </h3>
          <ul className="mt-2 space-y-1">
            {settingsNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium'
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>

        {/* User section */}
        <div className="mt-auto">
          <div className="px-2 py-3 border-t border-gray-700">
            <div className="flex items-center px-2 py-2">
              <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {user.profile?.firstName && user.profile?.lastName
                    ? `${user.profile.firstName} ${user.profile.lastName}`
                    : user.email}
                </p>
                <p className="text-xs text-gray-400">
                  {user.profile?.firstName ? user.email : 'User'}
                </p>
              </div>
            </div>
            <button
              onClick={logout}
              className="mt-2 w-full flex items-center px-2 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-md"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}