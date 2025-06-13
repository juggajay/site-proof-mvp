import type { User, Session } from '@supabase/supabase-js'

export interface AuthUser extends User {
  // Additional user properties if needed
}

export interface AuthSession extends Session {
  // Additional session properties if needed
}

export interface AuthContextType {
  user: AuthUser | null
  session: AuthSession | null
  loading: boolean
  signOut: () => Promise<void>
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  name?: string
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  user: AuthUser | null
  session: AuthSession | null
  error: AuthError | null
}