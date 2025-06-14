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
import { User as UserIcon, LogOut, ShieldCheck, Bell, Search, CheckCircle2 } from 'lucide-react'
import { ThemeToggle } from '../theme-toggle'
import Link from 'next/link'

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Enhanced Logo and Brand - Research-Backed Design */}
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              {/* Professional QA Badge Icon */}
              <div className="relative">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                {/* Quality Assurance Indicator */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center shadow-md">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              
              {/* Enhanced Brand Typography */}
              <div className="flex flex-col">
                <div className="text-2xl font-bold font-heading leading-tight">
                  <span className="text-primary-700">Site</span>
                  <span className="text-secondary-600 ml-1">Proof</span>
                </div>
                <div className="flex items-center space-x-2 -mt-1">
                  <span className="text-xs text-neutral-500 font-medium">Quality Assurance Platform</span>
                  <div className="w-1 h-1 bg-neutral-300 rounded-full"></div>
                  <span className="text-xs text-primary-600 font-semibold">MVP</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links - Hidden on mobile */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/dashboard"
              className="text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-primary-50"
            >
              Dashboard
            </Link>
            <Link
              href="/projects"
              className="text-neutral-700 hover:text-primary-600 font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-primary-50"
            >
              Projects
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Button */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="w-5 h-5 text-neutral-600" />
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-neutral-600" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error-500 rounded-full flex items-center justify-center">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              </span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary-200 transition-all duration-200">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center shadow-lg">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal p-3">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium text-neutral-900">
                          {user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <form action="/auth/logout" method="post">
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full text-left cursor-pointer flex items-center p-3 rounded-lg hover:bg-error-50 text-error-700 transition-colors duration-200">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-medium">Sign out</span>
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}