'use client'

import Link from 'next/link'
import { UserIcon } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'

/* Site-Proof Professional B2B Header - Exact Landing Page Implementation */
export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [supabase.auth])

  return (
    <header className="bg-white border-b-2 border-[#DEE2E6] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <div className="text-2xl font-heading font-bold text-[#2C3E50]">
              Site-Proof
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link
            href="/dashboard"
            className="font-primary text-sm text-[#2C3E50] hover:text-[#1B4F72] transition-colors duration-200 font-medium"
          >
            Dashboard
          </Link>
          <Link
            href="/projects"
            className="font-primary text-sm text-[#2C3E50] hover:text-[#1B4F72] transition-colors duration-200 font-medium"
          >
            Projects
          </Link>
          <Link
            href="/issues"
            className="font-primary text-sm text-[#2C3E50] hover:text-[#1B4F72] transition-colors duration-200 font-medium"
          >
            Issues
          </Link>
        </nav>

        {/* User Menu */}
        <div className="flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-8 h-8 bg-[#2C3E50] rounded-full flex items-center justify-center hover:bg-[#1B4F72] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:ring-offset-2">
                  <UserIcon className="w-4 h-4 text-white" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2 bg-white border border-[#DEE2E6] shadow-lg" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#2C3E50] rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-[#2C3E50] font-primary">
                          {user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-[#6C757D] font-primary">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#DEE2E6]" />
                <form action="/auth/logout" method="post">
                  <DropdownMenuItem asChild>
                    <button
                      type="submit"
                      className="w-full text-left cursor-pointer flex items-center p-3 rounded-lg hover:bg-[#F8F9FA] text-[#2C3E50] transition-colors duration-200 font-primary"
                    >
                      <UserIcon className="mr-2 h-4 w-4 text-[#6C757D]" />
                      Sign Out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/login"
                className="text-[#2C3E50] hover:text-[#1B4F72] font-medium text-sm font-primary"
              >
                Sign In
              </Link>
              <Link
                href="/auth/signup"
                className="bg-[#1B4F72] text-white hover:bg-[#154360] font-medium px-4 py-2 rounded-lg transition-all duration-200 text-sm font-primary"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}