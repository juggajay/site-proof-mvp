'use client'

import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { User, Settings, LogOut, HelpCircle } from 'lucide-react'

export function UserNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full hover:bg-slate-100">
          <Avatar className="h-8 w-8 border-2 border-slate-200">
            <AvatarImage src="/avatars/01.png" alt="User" />
            <AvatarFallback 
              className="font-heading font-semibold bg-blue-800 text-white"
            >
              QA
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 bg-white border-slate-200" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none font-heading text-slate-900">QA Inspector</p>
            <p className="text-xs leading-none text-slate-600 font-primary">
              qa.inspector@siteproof.com.au
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuGroup>
          <DropdownMenuItem className="font-primary hover:bg-slate-50 text-slate-700">
            <User className="mr-2 h-4 w-4 text-slate-600" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="font-primary hover:bg-slate-50 text-slate-700">
            <Settings className="mr-2 h-4 w-4 text-slate-600" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="font-primary hover:bg-slate-50 text-slate-700">
            <HelpCircle className="mr-2 h-4 w-4 text-slate-600" />
            <span>Help & Support</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-slate-200" />
        <DropdownMenuItem className="font-primary hover:bg-red-50 text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}