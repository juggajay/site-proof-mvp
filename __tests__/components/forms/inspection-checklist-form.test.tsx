import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InspectionChecklistForm } from '@/components/forms/inspection-checklist-form'
import { renderWithAuth, resetMocks } from '../../utils/test-utils'
import { LotWithDetails, ITPItem, ConformanceRecord } from '@/types/database'

// Mock the actions
jest.mock('@/lib/actions', () => ({
  saveConformanceRecordAction: jest.fn(),
}))

const { saveConformanceRecordAction } = require('@/lib/actions')

// Mock lot data for testing
const mockITPItems: ITPItem[] = [
  {
    id: 1,
    itp_template_id: 1,
    item_number: '1.1',
    description: 'Excavation depth verification',
    specification_reference: 'Drawing A-101',
    inspection_method: 'measurement',
    acceptance_criteria: 'As per approved drawings ±25mm',
    item_type: 'numeric',
    is_mandatory: true,
    order_index: 1,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    itp_template_id: 1,
    item_number: '1.2',
    description: 'Base preparation quality',
    specification_reference: 'Spec Section 03-01',
    inspection_method: 'visual',
    acceptance_criteria: 'Uniform, well compacted, no soft spots',
    item_type: 'pass_fail',
    is_mandatory: true,
    order_index: 2,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 3,
    itp_template_id: 1,
    item_number: '1.3',
    description: 'Inspection notes',
    specification_reference: 'QA Requirements',
    inspection_method: 'document_review',
    acceptance_criteria: 'Complete documentation required',
    item_type: 'text',
    is_mandatory: false,
    order_index: 3,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 4,
    itp_template_id: 1,
    item_number: '1.4',
    description: 'Photo documentation',
    specification_reference: 'Photo Requirements',
    inspection_method: 'visual',
    acceptance_criteria: 'Before, during, and after photos',
    item_type: 'photo_required',
    is_mandatory: true,
    order_index: 4,
    created_at: '2024-01-01T00:00:00Z',
  },
]

const mockConformanceRecords: ConformanceRecord[] = [
  {
    id: 1,
    lot_id: 1,
    itp_item_id: 1,
    result_pass_fail: 'PASS',
    result_numeric: 2450.5,
    result_text: null,
    comments: 'Measurement within tolerance',
    is_non_conformance: false,
    corrective_action: null,
    inspector_id: 2,
    inspection_date: '2024-01-16T10:00:00Z',
    approved_by: null,
    approval_date: null,
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z',
  },
]

const mockLot: LotWithDetails = {
  id: 1,
  project_id: 1,
  lot_number: 'LOT-001',
  description: 'Foundation work for Building A',
  location_description: 'Grid A1-A5',
  itp_template_id: 1,
  status: 'in_progress',
  start_date: '2024-01-15',
  target_completion_date: '2024-02-15',
  assigned_inspector_id: 2,
  created_by: 1,
  created_at: '2024-01-15T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
  project: {
    id: 1,
    name: 'Test Project',
    project_number: 'TP-001',
    description: 'Test project description',
    location: 'Test Location',
    start_date: '2024-01-01',
    end_date: '2024-12-31',
    status: 'active',
    organization_id: 1,
    created_by: 1,
    project_manager_id: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  itp_template: {
    id: 1,
    name: 'Concrete Foundation ITP',
    description: 'Standard concrete foundation inspection',
    category: 'structural',
    version: '1.0',
    is_active: true,
    organization_id: 1,
    created_by: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    itp_items: mockITPItems,
  },
  assigned_inspector: {
    id: 2,
    user_id: 2,
    first_name: 'Inspector',
    last_name: 'User',
    avatar_url: null,
    phone: null,
    timezone: 'UTC',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  conformance_records: mockConformanceRecords,
}

describe('InspectionChecklistForm', () => {
  const defaultProps = {
    lot: mockLot,
    onInspectionSaved: jest.fn(),
  }

  beforeEach(() => {
    resetMocks()
    saveConformanceRecordAction.mockClear()
    defaultProps.onInspectionSaved.mockClear()
  })

  it('should render inspection items', () => {
    renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Check that all items are rendered
    expect(screen.getByText('Excavation depth verification')).toBeInTheDocument()
    expect(screen.getByText('Base preparation quality')).toBeInTheDocument()
    expect(screen.getByText('Inspection notes')).toBeInTheDocument()
    expect(screen.getByText('Photo documentation')).toBeInTheDocument()

    // Check item numbers
    expect(screen.getByText('1.1')).toBeInTheDocument()
    expect(screen.getByText('1.2')).toBeInTheDocument()
    expect(screen.getByText('1.3')).toBeInTheDocument()
    expect(screen.getByText('1.4')).toBeInTheDocument()

    // Check required badges
    expect(screen.getAllByText('Required')).toHaveLength(3) // 3 mandatory items
  })

  it('should not render when lot has no ITP template', () => {
    const lotWithoutTemplate = { ...mockLot, itp_template: null }
    const { container } = renderWithAuth(
      <InspectionChecklistForm {...defaultProps} lot={lotWithoutTemplate} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should render different input types based on item type', () => {
    renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Numeric item should have number input and pass/fail select
    const numericItem = screen.getByText('Excavation depth verification').closest('div')
    if (numericItem) {
      expect(screen.getByRole('spinbutton')).toBeInTheDocument() // number input
      expect(screen.getAllByRole('combobox')).toHaveLength(2) // pass/fail selects
    }

    // Pass/fail item should have select only
    const passFailItem = screen.getByText('Base preparation quality').closest('div')
    // Should have pass/fail select

    // Text item should have textarea
    const textItem = screen.getByText('Inspection notes').closest('div')
    if (textItem) {
      expect(screen.getByRole('textbox', { name: /inspection notes/i })).toBeInTheDocument()
    }

    // Photo required item should have pass/fail select and photo placeholder
    const photoItem = screen.getByText('Photo documentation').closest('div')
    if (photoItem) {
      expect(screen.getByText(/photo upload functionality will be implemented/i)).toBeInTheDocument()
    }
  })

  it('should display existing conformance records', () => {
    renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // First item has existing record
    expect(screen.getByDisplayValue('2450.5')).toBeInTheDocument() // numeric result
    expect(screen.getByDisplayValue('PASS')).toBeInTheDocument() // pass/fail result
    expect(screen.getByDisplayValue('Measurement within tolerance')).toBeInTheDocument() // comments

    // Should show inspection date
    expect(screen.getByText(/inspected on/i)).toBeInTheDocument()
  })

  it('should handle form input changes', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Change numeric value for item 2 (no existing record)
    const numericInput = screen.getAllByRole('spinbutton')[1] // Second numeric input
    await user.clear(numericInput)
    await user.type(numericInput, '150.5')
    expect(numericInput).toHaveValue(150.5)

    // Change pass/fail for item 2
    const passFailSelect = screen.getAllByRole('combobox')[1] // Second pass/fail select
    await user.selectOptions(passFailSelect, 'PASS')
    expect(passFailSelect).toHaveValue('PASS')

    // Add comments
    const commentsInput = screen.getAllByPlaceholderText(/additional comments/i)[1]
    await user.type(commentsInput, 'Test comment')
    expect(commentsInput).toHaveValue('Test comment')
  })

  it('should show corrective action field when result is FAIL', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Select FAIL for an item
    const passFailSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(passFailSelect, 'FAIL')

    // Corrective action field should appear
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/describe corrective action/i)).toBeInTheDocument()
    })
  })

  it('should save individual inspection items', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Mock successful save
    saveConformanceRecordAction.mockResolvedValue({ success: true })

    // Fill form for item 2 (no existing record)
    const passFailSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(passFailSelect, 'PASS')

    const commentsInput = screen.getAllByPlaceholderText(/additional comments/i)[1]
    await user.type(commentsInput, 'New inspection comment')

    // Click save button
    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(saveConformanceRecordAction).toHaveBeenCalledWith(
        1, // lot id
        2, // item id
        {
          result_pass_fail: 'PASS',
          result_numeric: undefined,
          result_text: undefined,
          comments: 'New inspection comment',
          corrective_action: undefined,
        }
      )
      expect(defaultProps.onInspectionSaved).toHaveBeenCalledTimes(1)
    })
  })

  it('should show loading state during save', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Mock slow save
    saveConformanceRecordAction.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    )

    // Fill and save form
    const passFailSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(passFailSelect, 'PASS')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    // Should show loading state
    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
  })

  it('should handle save errors', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Mock save error
    saveConformanceRecordAction.mockResolvedValue({ 
      success: false, 
      error: 'Failed to save inspection' 
    })

    // Fill and save form
    const passFailSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(passFailSelect, 'PASS')

    const saveButton = screen.getByRole('button', { name: /save/i })
    await user.click(saveButton)

    await waitFor(() => {
      expect(screen.getByText(/failed to save inspection/i)).toBeInTheDocument()
    })

    expect(defaultProps.onInspectionSaved).not.toHaveBeenCalled()
  })

  it('should clear form data after successful save', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Mock successful save
    saveConformanceRecordAction.mockResolvedValue({ success: true })

    // Fill form
    const passFailSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(passFailSelect, 'PASS')

    const commentsInput = screen.getAllByPlaceholderText(/additional comments/i)[1]
    await user.type(commentsInput, 'Test comment')

    // Save
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(defaultProps.onInspectionSaved).toHaveBeenCalledTimes(1)
    })

    // Form should be cleared (back to default state)
    expect(passFailSelect).toHaveValue('')
    expect(commentsInput).toHaveValue('')
  })

  it('should show item status indicators', () => {
    renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // First item has existing record with PASS result - should show green check
    const passedItem = screen.getByText('Excavation depth verification').closest('.p-6')
    expect(passedItem?.querySelector('.text-green-600')).toBeInTheDocument()

    // Other items should show pending state (empty circle)
    const pendingItems = screen.getAllByText('Required')
    expect(pendingItems.length).toBeGreaterThan(0)
  })

  it('should handle network errors during save', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Mock network error
    saveConformanceRecordAction.mockRejectedValue(new Error('Network error'))

    // Fill and save form
    const passFailSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(passFailSelect, 'PASS')

    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/unexpected error occurred/i)).toBeInTheDocument()
    })
  })

  it('should show non-conformance indicator for failed items', () => {
    // Create lot with failed conformance record
    const lotWithFailedRecord = {
      ...mockLot,
      conformance_records: [
        {
          ...mockConformanceRecords[0],
          result_pass_fail: 'FAIL' as const,
          is_non_conformance: true,
        },
      ],
    }

    renderWithAuth(<InspectionChecklistForm {...defaultProps} lot={lotWithFailedRecord} />)

    expect(screen.getByText('Non-conformance')).toBeInTheDocument()
  })

  it('should handle different item types correctly', async () => {
    const { user } = renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Test numeric item (item 1 - already has data)
    const numericInputs = screen.getAllByRole('spinbutton')
    expect(numericInputs.length).toBeGreaterThan(0)

    // Test text item
    const textareas = screen.getAllByRole('textbox')
    const inspectionNotesTextarea = textareas.find(
      textarea => textarea.getAttribute('placeholder')?.includes('inspection notes')
    )
    if (inspectionNotesTextarea) {
      await user.type(inspectionNotesTextarea, 'Detailed inspection notes')
      expect(inspectionNotesTextarea).toHaveValue('Detailed inspection notes')
    }

    // Test photo required item
    expect(screen.getByText(/photo upload functionality will be implemented/i)).toBeInTheDocument()
  })

  it('should maintain accessibility standards', () => {
    renderWithAuth(<InspectionChecklistForm {...defaultProps} />)

    // Check for proper labels
    const selects = screen.getAllByRole('combobox')
    selects.forEach(select => {
      expect(select).toHaveAccessibleName()
    })

    const textboxes = screen.getAllByRole('textbox')
    textboxes.forEach(textbox => {
      expect(textbox).toHaveAccessibleName()
    })

    // Check for proper ARIA attributes
    const saveButton = screen.getByRole('button', { name: /save/i })
    expect(saveButton).toBeInTheDocument()
  })
})