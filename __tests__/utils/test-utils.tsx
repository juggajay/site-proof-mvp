import React, { ReactElement } from 'react'
import { render, RenderOptions, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, User } from '@/contexts/auth-context'

// Mock user data for testing
export const mockUser: User = {
  id: 1,
  email: 'test@example.com',
  emailVerified: true,
  profile: {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    avatarUrl: null,
    phone: null,
    timezone: 'UTC',
  },
  organizations: [
    {
      id: 1,
      name: 'Test Organization',
      slug: 'test-org',
      role: 'admin',
      status: 'active',
    },
  ],
}

// Mock auth context value
export const createMockAuthContext = (overrides: Partial<User> = {}) => ({
  user: { ...mockUser, ...overrides },
  loading: false,
  login: jest.fn().mockResolvedValue({}),
  signup: jest.fn().mockResolvedValue({}),
  logout: jest.fn().mockResolvedValue(undefined),
  refreshUser: jest.fn().mockResolvedValue(undefined),
})

// Custom render function that includes AuthProvider
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  user?: User | null
  authLoading?: boolean
}

export function renderWithAuth(
  ui: ReactElement,
  options: CustomRenderOptions = {}
) {
  const { user = null, authLoading = false, ...renderOptions } = options

  // Create wrapper component that provides AuthProvider
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthProvider>
        {children}
      </AuthProvider>
    )
  }

  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Helper to wait for async operations
export const waitForAsync = () => waitFor(() => {}, { timeout: 100 })

// Common test helpers
export const testHelpers = {
  // Helper to fill form fields
  async fillForm(fields: Record<string, string>) {
    const user = userEvent.setup()
    for (const [name, value] of Object.entries(fields)) {
      const field = screen.getByRole('textbox', { name: new RegExp(name, 'i') }) ||
                   screen.getByLabelText(new RegExp(name, 'i'))
      await user.clear(field)
      await user.type(field, value)
    }
  },

  // Helper to submit form
  async submitForm(buttonText = 'submit') {
    const user = userEvent.setup()
    const submitButton = screen.getByRole('button', { name: new RegExp(buttonText, 'i') })
    await user.click(submitButton)
  },

  // Helper to check for error messages
  expectError(message: string) {
    expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument()
  },

  // Helper to check for success states
  expectSuccess(message?: string) {
    if (message) {
      expect(screen.getByText(new RegExp(message, 'i'))).toBeInTheDocument()
    }
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument()
  },

  // Helper to wait for loading states
  async waitForLoading() {
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument()
    })
  },
}

// Mock API responses
export const mockApiResponses = {
  success: (data: any = {}) => ({
    ok: true,
    json: jest.fn().mockResolvedValue(data),
  }),

  authSuccess: (userData: any) => ({
    ok: true,
    json: jest.fn().mockResolvedValue({ user: userData }),
  }),

  error: (message = 'API Error', status = 400) => ({
    ok: false,
    status,
    json: jest.fn().mockResolvedValue({ success: false, error: message }),
  }),

  loading: () => new Promise(() => {}), // Never resolves (for loading states)
}

// Mock fetch globally for tests
export const mockFetch = (response: any) => {
  global.fetch = jest.fn().mockResolvedValue(response)
}

// Reset all mocks
export const resetMocks = () => {
  jest.clearAllMocks()
  if (global.fetch && typeof global.fetch === 'function') {
    (global.fetch as jest.Mock).mockClear()
  }
}

// Custom matchers
expect.extend({
  toBeDisabled(received) {
    const pass = received.disabled === true || received.getAttribute('disabled') !== null
    return {
      message: () => `expected element to ${pass ? 'not ' : ''}be disabled`,
      pass,
    }
  },
  toBeEnabled(received) {
    const pass = received.disabled === false && received.getAttribute('disabled') === null
    return {
      message: () => `expected element to ${pass ? 'not ' : ''}be enabled`,
      pass,
    }
  },
})

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeDisabled(): R
      toBeEnabled(): R
    }
  }
}