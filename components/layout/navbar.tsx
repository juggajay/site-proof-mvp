import Link from 'next/link'
import { SiteProofLogo } from '../ui/site-proof-logo'
import { Button } from '../ui/button'
import { UserNav } from './user-nav'

export function Navbar() {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <SiteProofLogo size="md" showText={true} />
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center space-x-6">
          <Link 
            href="/dashboard" 
            className="text-sm font-medium transition-colors hover:text-primary font-heading"
          >
            DASHBOARD
          </Link>
          <Link 
            href="/projects" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary font-heading"
          >
            PROJECTS
          </Link>
          <Link 
            href="/inspections" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary font-heading"
          >
            INSPECTIONS
          </Link>
          <Link 
            href="/reports" 
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary font-heading"
          >
            REPORTS
          </Link>
        </div>

        {/* User Menu */}
        <div className="flex items-center space-x-4">
          <UserNav />
        </div>
      </div>
    </nav>
  )
}