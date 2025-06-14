import Link from 'next/link'
import { SiteProofLogo } from '../ui/site-proof-logo'
import { UserNav } from './user-nav'

export function Navbar() {
  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center">
            <SiteProofLogo size="md" showText={true} />
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/dashboard" 
              className="text-sm font-navigation text-slate-700 transition-colors hover:text-blue-800"
            >
              DASHBOARD
            </Link>
            <Link 
              href="/projects" 
              className="text-sm font-navigation text-slate-600 transition-colors hover:text-blue-800"
            >
              PROJECTS
            </Link>
            <Link 
              href="/inspections" 
              className="text-sm font-navigation text-slate-600 transition-colors hover:text-blue-800"
            >
              INSPECTIONS
            </Link>
            <Link 
              href="/reports" 
              className="text-sm font-navigation text-slate-600 transition-colors hover:text-blue-800"
            >
              REPORTS
            </Link>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
    </nav>
  )
}