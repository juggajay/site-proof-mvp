'use client'

import { useState } from 'react'
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
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false)

  if (!user) return null

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 bg-white shadow-md"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile menu overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-gray-900">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <MobileSidebarContent 
              navigation={navigation}
              settingsNavigation={settingsNavigation}
              pathname={pathname}
              logout={logout}
              isSettingsExpanded={isSettingsExpanded}
              setIsSettingsExpanded={setIsSettingsExpanded}
              onNavigate={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex h-screen w-64 flex-col bg-gray-900">
        <DesktopSidebarContent 
          navigation={navigation}
          settingsNavigation={settingsNavigation}
          pathname={pathname}
          logout={logout}
          isSettingsExpanded={isSettingsExpanded}
          setIsSettingsExpanded={setIsSettingsExpanded}
        />
      </div>
    </>
  )
}

interface SidebarContentProps {
  navigation: any[]
  settingsNavigation: any[]
  pathname: string
  logout: () => void
  isSettingsExpanded: boolean
  setIsSettingsExpanded: (expanded: boolean) => void
  onNavigate?: () => void
  isMobile?: boolean
}

function DesktopSidebarContent({ navigation, settingsNavigation, pathname, logout, isSettingsExpanded, setIsSettingsExpanded }: SidebarContentProps) {
  return (
    <>
      {/* Logo and title */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <Building2 className="h-8 w-8 text-white" />
        <span className="ml-3 text-xl font-bold text-white">Site Proof</span>
      </div>

      <SidebarNavigation 
        navigation={navigation}
        settingsNavigation={settingsNavigation}
        pathname={pathname}
        logout={logout}
        isSettingsExpanded={isSettingsExpanded}
        setIsSettingsExpanded={setIsSettingsExpanded}
      />
    </>
  )
}

function MobileSidebarContent({ navigation, settingsNavigation, pathname, logout, isSettingsExpanded, setIsSettingsExpanded, onNavigate }: SidebarContentProps) {
  return (
    <>
      {/* Mobile Logo */}
      <div className="flex h-16 shrink-0 items-center px-4">
        <Building2 className="h-6 w-6 text-white" />
        <span className="ml-2 text-lg font-bold text-white">Site Proof</span>
      </div>
      
      <SidebarNavigation 
        navigation={navigation}
        settingsNavigation={settingsNavigation}
        pathname={pathname}
        logout={logout}
        isSettingsExpanded={isSettingsExpanded}
        setIsSettingsExpanded={setIsSettingsExpanded}
        onNavigate={onNavigate}
        isMobile={true}
      />
    </>
  )
}

function SidebarNavigation({ navigation, settingsNavigation, pathname, logout, isSettingsExpanded, setIsSettingsExpanded, onNavigate, isMobile = false }: SidebarContentProps) {
  const { user } = useAuth()
  
  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
      <ul className="space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                onClick={onNavigate}
                className={classNames(
                  isActive
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                  'group flex gap-x-3 rounded-md p-3 text-sm leading-6 font-medium',
                  isMobile ? 'p-4' : 'p-3'
                )}
              >
                <item.icon className={classNames('shrink-0', isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
                {item.name}
              </Link>
            </li>
          )
        })}
      </ul>

      {/* Settings section */}
      <div className="mt-6">
        <button
          onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
          className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-300"
        >
          <span>Settings</span>
          {isSettingsExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        
        {isSettingsExpanded && (
          <ul className="mt-2 space-y-1">
            {settingsNavigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={classNames(
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                      'group flex gap-x-3 rounded-md text-sm leading-6 font-medium',
                      isMobile ? 'p-4' : 'p-3'
                    )}
                  >
                    <item.icon className={classNames('shrink-0', isMobile ? 'h-6 w-6' : 'h-5 w-5')} />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {/* User section */}
      <div className="mt-auto">
        <div className={classNames('border-t border-gray-700', isMobile ? 'px-2 py-4' : 'px-2 py-3')}>
          <div className={classNames('flex items-center rounded-md', isMobile ? 'px-2 py-3' : 'px-2 py-2')}>
            <div className={classNames('rounded-full bg-gray-600 flex items-center justify-center', isMobile ? 'h-10 w-10' : 'h-8 w-8')}>
              <span className={classNames('font-medium text-white', isMobile ? 'text-base' : 'text-sm')}>
                {user?.profile?.firstName?.[0] || user?.email[0].toUpperCase()}
              </span>
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className={classNames('font-medium text-white truncate', isMobile ? 'text-base' : 'text-sm')}>
                {user?.profile?.firstName && user?.profile?.lastName
                  ? `${user.profile.firstName} ${user.profile.lastName}`
                  : user?.email}
              </p>
              <p className={classNames('text-gray-400 truncate', isMobile ? 'text-sm' : 'text-xs')}>
                {user?.profile?.firstName ? user?.email : 'User'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              onNavigate?.()
            }}
            className={classNames(
              'w-full flex items-center text-gray-300 hover:bg-gray-700 hover:text-white rounded-md',
              isMobile ? 'px-2 py-3 mt-3 text-base' : 'px-2 py-2 mt-2 text-sm'
            )}
          >
            <LogOut className={classNames('mr-3', isMobile ? 'h-5 w-5' : 'h-4 w-4')} />
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  )
}