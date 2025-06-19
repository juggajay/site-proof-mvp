import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth, useRequireAuth } from '@/contexts/auth-context'
import { mockFetch, mockApiResponses, resetMocks } from '../utils/test-utils'

// Mock Next.js router
const mockPush = jest.fn()
const mockReplace = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
}))

describe('AuthContext', () => {
  beforeEach(() => {
    resetMocks()
    mockPush.mockClear()
    mockReplace.mockClear()
  })

  describe('AuthProvider', () => {
    it('should provide initial auth state', async () => {
      // Mock fetch to prevent network calls during initial render
      mockFetch(mockApiResponses.error('Unauthorized', 401))
      
      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Initial state should have loading: true
      expect(authValue.user).toBeNull()
      expect(authValue.loading).toBe(true)
      expect(typeof authValue.login).toBe('function')
      expect(typeof authValue.signup).toBe('function')
      expect(typeof authValue.logout).toBe('function')
      expect(typeof authValue.refreshUser).toBe('function')
      
      // Wait for auth check to complete
      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })
    })

    it('should check authentication on mount', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        emailVerified: true,
      }

      mockFetch(mockApiResponses.success(mockUser))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div data-testid="test-component">Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/me', {
        credentials: 'include',
      })
      expect(authValue.user).toEqual(mockUser)
    })

    it('should handle auth check failure', async () => {
      mockFetch(mockApiResponses.error('Unauthorized', 401))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      expect(authValue.user).toBeNull()
    })
  })

  describe('login function', () => {
    it('should handle successful login', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        emailVerified: true,
      }

      // Mock the /api/auth/me call first (for initial auth check)
      mockFetch(mockApiResponses.error('Not authenticated', 401))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      // Mock successful login response
      mockFetch(mockApiResponses.success({ user: mockUser }))

      const result = await act(async () => {
        return authValue.login('test@example.com', 'password123')
      })

      expect(result).toEqual({})
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
        credentials: 'include',
      })
      expect(authValue.user).toEqual(mockUser)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle login failure', async () => {
      mockFetch(mockApiResponses.error('Unauthorized', 401))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      // Mock failed login response
      mockFetch(mockApiResponses.error('Invalid credentials', 401))

      const result = await act(async () => {
        return authValue.login('test@example.com', 'wrongpassword')
      })

      expect(result).toEqual({ error: 'Invalid credentials' })
      expect(authValue.user).toBeNull()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('should handle network error during login', async () => {
      mockFetch(mockApiResponses.error('Unauthorized', 401))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      // Mock network error
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      const result = await act(async () => {
        return authValue.login('test@example.com', 'password123')
      })

      expect(result).toEqual({ error: 'Network error. Please try again.' })
      expect(authValue.user).toBeNull()
    })
  })

  describe('signup function', () => {
    it('should handle successful signup', async () => {
      const mockUser = {
        id: 1,
        email: 'newuser@example.com',
        emailVerified: false,
      }

      mockFetch(mockApiResponses.error('Unauthorized', 401))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      // Mock successful signup response
      mockFetch(mockApiResponses.success({ user: mockUser }))

      const result = await act(async () => {
        return authValue.signup('newuser@example.com', 'password123', 'New', 'User')
      })

      expect(result).toEqual({})
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'newuser@example.com',
          password: 'password123',
          firstName: 'New',
          lastName: 'User',
        }),
        credentials: 'include',
      })
      expect(authValue.user).toEqual(mockUser)
      expect(mockPush).toHaveBeenCalledWith('/dashboard')
    })

    it('should handle signup failure', async () => {
      mockFetch(mockApiResponses.error('Unauthorized', 401))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.loading).toBe(false)
      })

      // Mock failed signup response
      mockFetch(mockApiResponses.error('Email already exists', 400))

      const result = await act(async () => {
        return authValue.signup('existing@example.com', 'password123')
      })

      expect(result).toEqual({ error: 'Email already exists' })
      expect(authValue.user).toBeNull()
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('logout function', () => {
    it('should handle logout', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        emailVerified: true,
      }

      // Mock initial auth check to return user
      mockFetch(mockApiResponses.success(mockUser))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.user).toEqual(mockUser)
      })

      // Mock logout response
      mockFetch(mockApiResponses.success({}))

      await act(async () => {
        await authValue.logout()
      })

      expect(global.fetch).toHaveBeenCalledWith('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })
      expect(authValue.user).toBeNull()
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('should handle logout even if API call fails', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        emailVerified: true,
      }

      mockFetch(mockApiResponses.success(mockUser))

      let authValue: any

      function TestComponent() {
        authValue = useAuth()
        return <div>Test</div>
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(authValue.user).toEqual(mockUser)
      })

      // Mock logout failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await authValue.logout()
      })

      // Should still clear user and redirect
      expect(authValue.user).toBeNull()
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })
  })

  describe('useRequireAuth hook', () => {
    it('should redirect unauthenticated users', async () => {
      mockFetch(mockApiResponses.error('Unauthorized', 401))

      function TestComponent() {
        const { user, loading } = useRequireAuth()
        return (
          <div>
            <div data-testid="user">{user ? 'authenticated' : 'not authenticated'}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('not authenticated')
      expect(mockPush).toHaveBeenCalledWith('/auth/login')
    })

    it('should not redirect authenticated users', async () => {
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        emailVerified: true,
      }

      mockFetch(mockApiResponses.success(mockUser))

      function TestComponent() {
        const { user, loading } = useRequireAuth()
        return (
          <div>
            <div data-testid="user">{user ? 'authenticated' : 'not authenticated'}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('loaded')
      })

      expect(screen.getByTestId('user')).toHaveTextContent('authenticated')
      expect(mockPush).not.toHaveBeenCalledWith('/auth/login')
    })

    it('should not redirect while loading', async () => {
      // Mock a request that never resolves to simulate loading
      global.fetch = jest.fn().mockImplementation(() => new Promise(() => {}))

      function TestComponent() {
        const { user, loading } = useRequireAuth()
        return (
          <div>
            <div data-testid="user">{user ? 'authenticated' : 'not authenticated'}</div>
            <div data-testid="loading">{loading ? 'loading' : 'loaded'}</div>
          </div>
        )
      }

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Should still be loading
      expect(screen.getByTestId('loading')).toHaveTextContent('loading')
      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('error handling', () => {
    it('should handle auth context used outside provider', () => {
      function TestComponent() {
        useAuth()
        return <div>Test</div>
      }

      // Should throw error when used outside AuthProvider
      expect(() => render(<TestComponent />)).toThrow(
        'useAuth must be used within an AuthProvider'
      )
    })
  })
})