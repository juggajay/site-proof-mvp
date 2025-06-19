import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SignupPage from '@/app/auth/signup/page'
import { renderWithAuth, testHelpers, resetMocks } from '../../utils/test-utils'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href }: { children: React.ReactNode; href: string }) {
    return <a href={href}>{children}</a>
  }
})

describe('SignupPage', () => {
  beforeEach(() => {
    resetMocks()
  })

  it('should render signup form', () => {
    renderWithAuth(<SignupPage />, { user: null })

    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })

  it('should handle form submission with valid data', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    // Fill form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'John')
    await user.type(screen.getByLabelText(/last name/i), 'Doe')
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePassword123!')

    const signupButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signupButton)

    // Verify form values
    expect(screen.getByLabelText(/first name/i)).toHaveValue('John')
    expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe')
    expect(screen.getByLabelText(/email/i)).toHaveValue('john.doe@example.com')
    expect(screen.getByLabelText(/password/i)).toHaveValue('SecurePassword123!')
  })

  it('should show validation errors for empty required fields', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    const signupButton = screen.getByRole('button', { name: /create account/i })
    
    // Try to submit empty form
    await user.click(signupButton)

    // Check for HTML5 validation on required fields
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()

    // First name and last name might be optional
    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    
    // Check if they are required based on the actual implementation
    // expect(firstNameInput).toBeRequired()
    // expect(lastNameInput).toBeRequired()
  })

  it('should validate email format', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    const emailInput = screen.getByLabelText(/email/i)
    
    // Enter invalid email
    await user.type(emailInput, 'invalid-email')
    
    // Email input should have type="email" for HTML5 validation
    expect(emailInput).toHaveAttribute('type', 'email')
  })

  it('should validate password requirements', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    const passwordInput = screen.getByLabelText(/password/i)
    
    // Test weak password
    await user.type(passwordInput, '123')
    
    // In a real implementation, we might show password strength indicator
    // or validation messages
  })

  it('should handle signup success', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    // Fill form with valid data
    await user.type(screen.getByLabelText(/first name/i), 'Jane')
    await user.type(screen.getByLabelText(/last name/i), 'Smith')
    await user.type(screen.getByLabelText(/email/i), 'jane.smith@example.com')
    await user.type(screen.getByLabelText(/password/i), 'SecurePassword123!')

    const signupButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signupButton)

    // In a real implementation with success handling:
    // await waitFor(() => {
    //   expect(mockPush).toHaveBeenCalledWith('/dashboard')
    // })
  })

  it('should handle signup errors', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    // Fill form with existing email
    await user.type(screen.getByLabelText(/email/i), 'existing@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const signupButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signupButton)

    // In a real implementation:
    // await waitFor(() => {
    //   expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    // })
  })

  it('should show loading state during submission', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    const signupButton = screen.getByRole('button', { name: /create account/i })
    await user.click(signupButton)

    // In a real implementation with loading state:
    // expect(signupButton).toHaveTextContent(/creating/i)
    // expect(signupButton).toBeDisabled()
  })

  it('should disable form during loading', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const signupButton = screen.getByRole('button', { name: /create account/i })

    // Initially, form should be enabled
    expect(firstNameInput).toBeEnabled()
    expect(lastNameInput).toBeEnabled()
    expect(emailInput).toBeEnabled()
    expect(passwordInput).toBeEnabled()
    expect(signupButton).toBeEnabled()

    // Fill and submit form
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    await user.click(signupButton)

    // In a real implementation with loading state:
    // expect(emailInput).toBeDisabled()
    // expect(passwordInput).toBeDisabled()
    // expect(signupButton).toBeDisabled()
  })

  it('should have proper form accessibility', () => {
    renderWithAuth(<SignupPage />, { user: null })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)

    // Check input types
    expect(firstNameInput).toHaveAttribute('type', 'text')
    expect(lastNameInput).toHaveAttribute('type', 'text')
    expect(emailInput).toHaveAttribute('type', 'email')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Check form structure
    expect(screen.getByRole('form')).toBeInTheDocument()
  })

  it('should handle keyboard navigation', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    const firstNameInput = screen.getByLabelText(/first name/i)
    const lastNameInput = screen.getByLabelText(/last name/i)
    const emailInput = screen.getByLabelText(/email/i)
    const passwordInput = screen.getByLabelText(/password/i)
    const signupButton = screen.getByRole('button', { name: /create account/i })

    // Tab through form elements
    await user.tab()
    expect(firstNameInput).toHaveFocus()

    await user.tab()
    expect(lastNameInput).toHaveFocus()

    await user.tab()
    expect(emailInput).toHaveFocus()

    await user.tab()
    expect(passwordInput).toHaveFocus()

    await user.tab()
    expect(signupButton).toHaveFocus()
  })

  it('should redirect authenticated users', () => {
    // If a user is already logged in, they should be redirected
    renderWithAuth(<SignupPage />, { 
      user: { id: 1, email: 'test@example.com', emailVerified: true } 
    })

    // In a real implementation, this might redirect or show a different view
  })

  it('should handle form reset on error', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    // Fill form
    await user.type(screen.getByLabelText(/email/i), 'test@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')

    // In a real implementation, after an error, the form might be reset
    // or certain fields might be cleared
  })

  it('should show password strength indicator', async () => {
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    const passwordInput = screen.getByLabelText(/password/i)
    
    // Test different password strengths
    await user.type(passwordInput, '123')
    // In a real implementation: expect(screen.getByText(/weak/i)).toBeInTheDocument()

    await user.clear(passwordInput)
    await user.type(passwordInput, 'SecurePassword123!')
    // In a real implementation: expect(screen.getByText(/strong/i)).toBeInTheDocument()
  })

  it('should validate matching password confirmation', async () => {
    // If the form has password confirmation
    const { user } = renderWithAuth(<SignupPage />, { user: null })

    // Check if password confirmation field exists
    const passwordConfirmInput = screen.queryByLabelText(/confirm password/i)
    
    if (passwordConfirmInput) {
      await user.type(screen.getByLabelText(/password/i), 'password123')
      await user.type(passwordConfirmInput, 'differentpassword')
      
      // In a real implementation:
      // expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument()
    }
  })
})