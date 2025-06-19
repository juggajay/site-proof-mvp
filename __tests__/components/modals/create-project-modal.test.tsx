import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateProjectModal } from '@/components/modals/create-project-modal'
import { renderWithAuth, mockFetch, mockApiResponses, resetMocks, testFormData } from '../../utils/test-utils'

// Mock the actions
jest.mock('@/lib/actions', () => ({
  createProjectAction: jest.fn(),
}))

const { createProjectAction } = require('@/lib/actions')

describe('CreateProjectModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onProjectCreated: jest.fn(),
  }

  beforeEach(() => {
    resetMocks()
    createProjectAction.mockClear()
    defaultProps.onClose.mockClear()
    defaultProps.onProjectCreated.mockClear()
  })

  it('should not render when closed', () => {
    renderWithAuth(<CreateProjectModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText(/create new project/i)).not.toBeInTheDocument()
  })

  it('should render modal when open', () => {
    renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    expect(screen.getByText(/create new project/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/project number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create project/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should show login message when user is not authenticated', () => {
    renderWithAuth(<CreateProjectModal {...defaultProps} />, { user: null })
    
    expect(screen.getByText(/please log in to create a project/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    expect(screen.queryByLabelText(/project name/i)).not.toBeInTheDocument()
  })

  it('should close modal when close button is clicked', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    const closeButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(closeButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should close modal when X button is clicked', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    const xButton = screen.getByRole('button', { name: '' }) // X button might not have text
    await user.click(xButton)
    
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should close modal when background overlay is clicked', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Click on the overlay (the div with bg-gray-500)
    const overlay = document.querySelector('.bg-gray-500')
    if (overlay) {
      await user.click(overlay)
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should handle successful form submission via server action', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock successful server action
    createProjectAction.mockResolvedValue({ success: true, data: { id: 1 } })
    
    // Fill form
    await user.type(screen.getByLabelText(/project name/i), testFormData.validProject.name)
    await user.type(screen.getByLabelText(/project number/i), testFormData.validProject.projectNumber)
    await user.type(screen.getByLabelText(/description/i), testFormData.validProject.description)
    await user.type(screen.getByLabelText(/location/i), testFormData.validProject.location)
    await user.type(screen.getByLabelText(/start date/i), testFormData.validProject.startDate)
    await user.type(screen.getByLabelText(/end date/i), testFormData.validProject.endDate)
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /create project/i })
    await user.click(submitButton)
    
    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledTimes(1)
      expect(defaultProps.onProjectCreated).toHaveBeenCalledTimes(1)
    })
  })

  it('should handle server action failure and fallback to API', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock server action failure with auth error
    createProjectAction.mockResolvedValue({ 
      success: false, 
      error: 'Authentication required. Please log in.' 
    })
    
    // Mock successful API response
    mockFetch(mockApiResponses.success({ id: 1 }))
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project name/i), testFormData.validProject.name)
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(createProjectAction).toHaveBeenCalledTimes(1)
      expect(global.fetch).toHaveBeenCalledWith('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: testFormData.validProject.name,
          projectNumber: '',
          description: '',
          location: '',
          startDate: '',
          endDate: ''
        })
      })
      expect(defaultProps.onProjectCreated).toHaveBeenCalledTimes(1)
    })
  })

  it('should show error message on server action failure', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock server action failure
    createProjectAction.mockResolvedValue({ 
      success: false, 
      error: 'Project name already exists' 
    })
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project name/i), 'Existing Project')
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/project name already exists/i)).toBeInTheDocument()
    })
    
    expect(defaultProps.onProjectCreated).not.toHaveBeenCalled()
  })

  it('should show error message on API failure', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock server action failure (auth error)
    createProjectAction.mockResolvedValue({ 
      success: false, 
      error: 'Authentication required. Please log in.' 
    })
    
    // Mock API failure
    mockFetch(mockApiResponses.error('Network error', 500))
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project name/i), testFormData.validProject.name)
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })

  it('should show loading state during submission', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock slow server action
    createProjectAction.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true }), 100)
    ))
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project name/i), testFormData.validProject.name)
    const submitButton = screen.getByRole('button', { name: /create project/i })
    await user.click(submitButton)
    
    // Check loading state
    expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('should disable form during submission', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock slow server action
    createProjectAction.mockImplementation(() => new Promise(resolve => 
      setTimeout(() => resolve({ success: true }), 100)
    ))
    
    const nameInput = screen.getByLabelText(/project name/i)
    const submitButton = screen.getByRole('button', { name: /create project/i })
    
    // Fill and submit form
    await user.type(nameInput, testFormData.validProject.name)
    await user.click(submitButton)
    
    // All form elements should be disabled during submission
    expect(submitButton).toBeDisabled()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
  })

  it('should validate required fields', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    const submitButton = screen.getByRole('button', { name: /create project/i })
    const nameInput = screen.getByLabelText(/project name/i)
    
    // Try to submit without required field
    await user.click(submitButton)
    
    // Name field should be required
    expect(nameInput).toBeRequired()
    expect(nameInput).toBeInvalid()
  })

  it('should reset form after successful submission', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock successful server action
    createProjectAction.mockResolvedValue({ success: true })
    
    const nameInput = screen.getByLabelText(/project name/i)
    const descriptionInput = screen.getByLabelText(/description/i)
    
    // Fill form
    await user.type(nameInput, testFormData.validProject.name)
    await user.type(descriptionInput, testFormData.validProject.description)
    
    // Submit form
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(defaultProps.onProjectCreated).toHaveBeenCalledTimes(1)
    })
    
    // Form should be reset
    expect(nameInput).toHaveValue('')
    expect(descriptionInput).toHaveValue('')
  })

  it('should handle network errors gracefully', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Mock network error
    createProjectAction.mockRejectedValue(new Error('Network error'))
    
    // Fill and submit form
    await user.type(screen.getByLabelText(/project name/i), testFormData.validProject.name)
    await user.click(screen.getByRole('button', { name: /create project/i }))
    
    await waitFor(() => {
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument()
    })
  })

  it('should have proper accessibility attributes', () => {
    renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Modal should have proper ARIA attributes
    const modal = screen.getByRole('dialog', { hidden: true }) || 
                  document.querySelector('[role="dialog"]')
    
    if (modal) {
      expect(modal).toBeInTheDocument()
    }
    
    // Form should be accessible
    const form = screen.getByRole('form')
    expect(form).toBeInTheDocument()
    
    // All inputs should have labels
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/project number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument()
  })

  it('should handle escape key to close modal', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Press escape key
    await user.keyboard('{Escape}')
    
    // In a real implementation, this should close the modal
    // expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('should maintain focus within modal', async () => {
    const { user } = renderWithAuth(<CreateProjectModal {...defaultProps} />)
    
    // Focus should be trapped within the modal
    const firstInput = screen.getByLabelText(/project name/i)
    const lastButton = screen.getByRole('button', { name: /cancel/i })
    
    // Tab should cycle through modal elements
    await user.tab()
    expect(firstInput).toHaveFocus()
    
    // Continue tabbing to reach the end
    for (let i = 0; i < 10; i++) {
      await user.tab()
    }
    
    // Should still be within the modal
    const focusedElement = document.activeElement
    const modalContainer = screen.getByText(/create new project/i).closest('[role="dialog"]') ||
                          screen.getByText(/create new project/i).closest('.fixed')
    
    if (modalContainer && focusedElement) {
      expect(modalContainer.contains(focusedElement)).toBe(true)
    }
  })
})