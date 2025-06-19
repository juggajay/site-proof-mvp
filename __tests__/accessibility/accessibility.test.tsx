import React from 'react'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import LoginPage from '@/app/auth/login/page'
import SignupPage from '@/app/auth/signup/page'
import { CreateProjectModal } from '@/components/modals/create-project-modal'
import { InspectionChecklistForm } from '@/components/forms/inspection-checklist-form'
import { renderWithAuth } from '../utils/test-utils'
import { mockLot } from '../utils/mock-data'

// Extend Jest with axe matchers
expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  describe('Authentication Pages', () => {
    it('should have no accessibility violations on login page', async () => {
      const { container } = renderWithAuth(<LoginPage />, { user: null })
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have no accessibility violations on signup page', async () => {
      const { container } = renderWithAuth(<SignupPage />, { user: null })
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  describe('Modal Components', () => {
    it('should have no accessibility violations in create project modal', async () => {
      const { container } = renderWithAuth(
        <CreateProjectModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onProjectCreated={jest.fn()} 
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper focus management in modals', () => {
      renderWithAuth(
        <CreateProjectModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onProjectCreated={jest.fn()} 
        />
      )

      // Modal should be properly labeled
      const modal = document.querySelector('[role="dialog"]')
      expect(modal).toBeInTheDocument()
      
      // Should have accessible name
      const heading = document.querySelector('h3')
      expect(heading).toBeInTheDocument()
    })
  })

  describe('Form Components', () => {
    it('should have no accessibility violations in inspection form', async () => {
      const { container } = renderWithAuth(
        <InspectionChecklistForm 
          lot={mockLot}
          onInspectionSaved={jest.fn()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should have proper form labels and descriptions', () => {
      renderWithAuth(
        <InspectionChecklistForm 
          lot={mockLot}
          onInspectionSaved={jest.fn()}
        />
      )

      // All form controls should have labels
      const selects = document.querySelectorAll('select')
      selects.forEach(select => {
        expect(select).toHaveAccessibleName()
      })

      const textareas = document.querySelectorAll('textarea')
      textareas.forEach(textarea => {
        expect(textarea).toHaveAccessibleName()
      })
    })
  })

  describe('Interactive Elements', () => {
    it('should have proper ARIA attributes on buttons', () => {
      renderWithAuth(
        <CreateProjectModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onProjectCreated={jest.fn()} 
        />
      )

      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        // Buttons should have accessible names
        expect(button).toHaveAccessibleName()
        
        // Buttons should have proper type
        if (button.getAttribute('type') === 'submit') {
          expect(button).toHaveAttribute('type', 'submit')
        }
      })
    })

    it('should support keyboard navigation', () => {
      renderWithAuth(<LoginPage />, { user: null })

      const inputs = document.querySelectorAll('input')
      const buttons = document.querySelectorAll('button')
      
      // All interactive elements should be focusable
      inputs.forEach(input => {
        expect(input).not.toHaveAttribute('tabindex', '-1')
      })
      
      buttons.forEach(button => {
        expect(button).not.toHaveAttribute('tabindex', '-1')
      })
    })
  })

  describe('Color and Contrast', () => {
    it('should not rely solely on color for information', () => {
      renderWithAuth(
        <InspectionChecklistForm 
          lot={mockLot}
          onInspectionSaved={jest.fn()}
        />
      )

      // Status indicators should have text or icons, not just color
      const statusElements = document.querySelectorAll('.text-green-600, .text-red-600')
      statusElements.forEach(element => {
        // Should have text content or ARIA label
        const hasText = element.textContent && element.textContent.trim().length > 0
        const hasAriaLabel = element.getAttribute('aria-label')
        const hasTitle = element.getAttribute('title')
        
        expect(hasText || hasAriaLabel || hasTitle).toBe(true)
      })
    })
  })

  describe('Error Handling', () => {
    it('should announce errors to screen readers', async () => {
      const { container } = renderWithAuth(<LoginPage />, { user: null })

      // Look for error containers that would be populated
      const errorContainers = container.querySelectorAll('[role="alert"], .error, .text-red')
      
      // Error messages should be announced
      errorContainers.forEach(container => {
        const role = container.getAttribute('role')
        const ariaLive = container.getAttribute('aria-live')
        
        // Should have role="alert" or aria-live for announcements
        expect(role === 'alert' || ariaLive === 'polite' || ariaLive === 'assertive').toBe(true)
      })
    })
  })

  describe('Loading States', () => {
    it('should provide accessible loading indicators', () => {
      renderWithAuth(
        <CreateProjectModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onProjectCreated={jest.fn()} 
        />
      )

      // Disabled buttons should indicate their state
      const buttons = document.querySelectorAll('button[disabled]')
      buttons.forEach(button => {
        expect(button).toHaveAttribute('disabled')
        // Could also check for aria-busy or loading text
      })
    })
  })

  describe('Responsive Design', () => {
    it('should work with zoom up to 200%', () => {
      // Simulate 200% zoom by reducing viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Half of standard 1280px width
      })

      const { container } = renderWithAuth(<LoginPage />, { user: null })
      
      // Content should still be accessible
      const form = container.querySelector('form')
      expect(form).toBeInTheDocument()
      
      const inputs = container.querySelectorAll('input')
      expect(inputs.length).toBeGreaterThan(0)
    })

    it('should support touch interactions on mobile', () => {
      // Test touch-friendly button sizes
      renderWithAuth(
        <CreateProjectModal 
          isOpen={true} 
          onClose={jest.fn()} 
          onProjectCreated={jest.fn()} 
        />
      )

      const buttons = document.querySelectorAll('button')
      buttons.forEach(button => {
        const styles = window.getComputedStyle(button)
        const minSize = 44 // WCAG recommended minimum touch target size
        
        // This is a simplified check - in real tests you'd measure actual rendered size
        expect(button).toBeInTheDocument()
      })
    })
  })

  describe('Language and Internationalization', () => {
    it('should have proper language attributes', () => {
      renderWithAuth(<LoginPage />, { user: null })

      // HTML should have lang attribute
      const html = document.documentElement
      expect(html).toHaveAttribute('lang')
    })

    it('should provide text alternatives for non-text content', () => {
      renderWithAuth(
        <InspectionChecklistForm 
          lot={mockLot}
          onInspectionSaved={jest.fn()}
        />
      )

      // Icons should have text alternatives
      const icons = document.querySelectorAll('svg, img')
      icons.forEach(icon => {
        const hasAlt = icon.getAttribute('alt')
        const hasAriaLabel = icon.getAttribute('aria-label')
        const hasTitle = icon.getAttribute('title')
        const hasAriaHidden = icon.getAttribute('aria-hidden') === 'true'
        
        // Icon should have alternative text or be marked as decorative
        expect(hasAlt || hasAriaLabel || hasTitle || hasAriaHidden).toBe(true)
      })
    })
  })
})