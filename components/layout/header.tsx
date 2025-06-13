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
import { ThemeToggle } from '../theme-toggle'

interface HeaderProps {
  user: User | null
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-6">
      <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="relative">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-primary-foreground" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs leading-none text-muted-foreground">
                  Signed in as
                </p>
                <p className="text-sm font-medium leading-none">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <form action="/auth/logout" method="post">
              <DropdownMenuItem asChild>
                <button type="submit" className="w-full text-left cursor-pointer flex items-center">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
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