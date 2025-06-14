'use client'

import { User } from '@supabase/supabase-js'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu'
import { User as UserIcon, LogOut } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="bg-site-proof-white border-b-2 border-site-proof-border-grey">
      <div className="site-proof-container h-16 flex items-center justify-between">
        {/* LEFT: Logo - MANDATORY */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <div className="text-2xl font-heading text-site-proof-charcoal">
              Site-Proof
            </div>
          </Link>
        </div>
        
        {/* CENTER: App Navigation - App Pages ONLY */}
        <nav className="hidden md:flex space-x-8">
          <Link
            href="/dashboard"
            className="font-navigation text-sm text-site-proof-charcoal hover:text-site-proof-clarity-blue transition-colors duration-200"
          >
            DASHBOARD
          </Link>
          <Link
            href="/projects"
            className="font-navigation text-sm text-site-proof-charcoal hover:text-site-proof-clarity-blue transition-colors duration-200"
          >
            PROJECTS
          </Link>
          <Link
            href="/issues"
            className="font-navigation text-sm text-site-proof-charcoal hover:text-site-proof-clarity-blue transition-colors duration-200"
          >
            ISSUES
          </Link>
        </nav>
        
        {/* RIGHT: User Profile + Primary Action - MANDATORY */}
        <div className="flex items-center space-x-4">
          <button className="site-proof-btn-primary">
            LOG NEW ISSUE
          </button>
          
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-8 h-8 bg-site-proof-charcoal rounded-full flex items-center justify-center hover:bg-opacity-80 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-site-proof-clarity-blue focus:ring-offset-2">
                <UserIcon className="w-4 h-4 text-site-proof-white" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2 bg-site-proof-white border border-site-proof-border-grey" align="end" forceMount>
              <DropdownMenuLabel className="font-normal p-3">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-site-proof-charcoal rounded-full flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-site-proof-white" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-site-proof-charcoal font-primary">
                        {user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-site-proof-placeholder font-primary">
                        {user?.email}
                      </p>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-site-proof-border-grey" />
              <form action="/auth/logout" method="post">
                <DropdownMenuItem asChild>
                  <button 
                    type="submit" 
                    className="w-full text-left cursor-pointer flex items-center p-3 rounded-lg hover:bg-site-proof-off-white text-site-proof-charcoal transition-colors duration-200 font-primary"
                  >
                    <LogOut className="mr-3 h-4 w-4" />
                    <span className="font-medium">Sign out</span>
                  </button>
                </DropdownMenuItem>
              </form>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}