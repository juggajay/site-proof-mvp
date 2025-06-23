'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export interface User {
  id: number
  email: string
  emailVerified: boolean
  profile?: {
    id: number
    firstName?: string
    lastName?: string
    avatarUrl?: string
    phone?: string
    timezone: string
  }
  organizations?: {
    id: number
    name: string
    slug: string
    role: string
    status: string
  }[]
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Check for existing session on mount
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // TEMPORARY: Bypass authentication - always set mock user
      const mockUser = {
        id: 1,
        email: 'demo@siteproof.com',
        emailVerified: true,
        profile: {
          id: 1,
          firstName: 'Demo',
          lastName: 'User',
          avatarUrl: undefined,
          phone: '+61 400 000 000',
          timezone: 'Australia/Brisbane'
        },
        organizations: [{
          id: 1,
          name: 'Demo Construction Company',
          slug: 'demo-construction',
          role: 'admin',
          status: 'active'
        }]
      }
      setUser(mockUser)
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ error?: string }> => {
    // TEMPORARY: Bypass authentication - always succeed
    const mockUser = {
      id: 1,
      email: 'demo@siteproof.com',
      emailVerified: true,
      profile: {
        id: 1,
        firstName: 'Demo',
        lastName: 'User',
        avatarUrl: undefined,
        phone: '+61 400 000 000',
        timezone: 'Australia/Brisbane'
      },
      organizations: [{
        id: 1,
        name: 'Demo Construction Company',
        slug: 'demo-construction',
        role: 'admin',
        status: 'active'
      }]
    }
    setUser(mockUser)
    router.push('/dashboard')
    return {}
  }

  const signup = async (
    email: string, 
    password: string, 
    firstName?: string, 
    lastName?: string
  ): Promise<{ error?: string }> => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password, 
          firstName, 
          lastName 
        }),
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        router.push('/dashboard')
        return {}
      } else {
        return { error: data.error || 'Signup failed' }
      }
    } catch (error) {
      console.error('Signup error:', error)
      return { error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      router.push('/auth/login')
    }
  }

  const refreshUser = async () => {
    await checkAuth()
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for protected routes
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // TEMPORARY: Bypass authentication - don't redirect to login
    // if (!loading && !user) {
    //   router.push('/auth/login')
    // }
  }, [user, loading, router])

  return { user, loading }
}