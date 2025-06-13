import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '../../types/database'

// Singleton instance to prevent multiple clients
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing instance if available
  if (supabaseInstance) {
    return supabaseInstance
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    )
  }

  // Create client with proper configuration
  supabaseInstance = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: 'pkce',
      },
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined
          return getCookie(name)
        },
        set(name: string, value: string, options: any) {
          if (typeof document === 'undefined') return
          setCookie(name, value, options)
        },
        remove(name: string, options: any) {
          if (typeof document === 'undefined') return
          removeCookie(name, options)
        },
      },
    }
  )

  return supabaseInstance
}

// Cookie utilities
function getCookie(name: string): string | undefined {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift()
  }
}

function setCookie(name: string, value: string, options: any = {}) {
  const expires = options.expires ? `; expires=${options.expires.toUTCString()}` : ''
  const path = options.path ? `; path=${options.path}` : '; path=/'
  const secure = options.secure ? '; secure' : ''
  const sameSite = options.sameSite ? `; samesite=${options.sameSite}` : '; samesite=lax'
  
  document.cookie = `${name}=${value}${expires}${path}${secure}${sameSite}`
}

function removeCookie(name: string, options: any = {}) {
  setCookie(name, '', { ...options, expires: new Date(0) })
}