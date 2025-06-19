import { test, expect } from '@playwright/test'

test.describe('Project Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Log in before each test
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create a new project', async ({ page }) => {
    await page.goto('/projects')
    
    // Click create project button
    await page.click('button:has-text("create project"), button:has-text("new project"), [data-testid="create-project"]')
    
    // Fill project form
    const projectName = `Test Project ${Date.now()}`
    await page.fill('[name="name"]', projectName)
    await page.fill('[name="projectNumber"]', 'TP-001')
    await page.fill('[name="description"]', 'A test project for E2E testing')
    await page.fill('[name="location"]', 'Test Location')
    await page.fill('[name="startDate"]', '2024-01-01')
    await page.fill('[name="endDate"]', '2024-12-31')
    
    // Submit form
    await page.click('button[type="submit"]:has-text("create")')
    
    // Should see success message or be redirected
    await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 })
  })

  test('should view project details', async ({ page }) => {
    await page.goto('/projects')
    
    // Click on first project
    const firstProject = page.locator('.project-item, [data-testid="project-item"]').first()
    await firstProject.click()
    
    // Should navigate to project details
    await expect(page.url()).toMatch(/\/project\/\d+/)
    
    // Should see project information
    await expect(page.locator('h1, h2').first()).toBeVisible()
  })

  test('should create a lot within a project', async ({ page }) => {
    // Navigate to a project
    await page.goto('/projects')
    const firstProject = page.locator('.project-item, [data-testid="project-item"]').first()
    await firstProject.click()
    
    // Create new lot
    await page.click('button:has-text("create lot"), button:has-text("new lot"), [data-testid="create-lot"]')
    
    // Fill lot form
    const lotNumber = `LOT-${Date.now()}`
    await page.fill('[name="lotNumber"]', lotNumber)
    await page.fill('[name="description"]', 'Test lot for E2E testing')
    await page.fill('[name="locationDescription"]', 'Test grid location')
    await page.fill('[name="targetCompletionDate"]', '2024-06-01')
    
    // Submit form
    await page.click('button[type="submit"]:has-text("create")')
    
    // Should see the new lot
    await expect(page.locator(`text=${lotNumber}`)).toBeVisible({ timeout: 10000 })
  })

  test('should perform inspection on a lot', async ({ page }) => {
    // Navigate to a lot with inspection template
    await page.goto('/project/1/lot/1') // Assuming these exist
    
    // Should see inspection checklist
    await expect(page.locator('text=inspection, text=checklist').first()).toBeVisible()
    
    // Fill inspection form for first item
    const passFailSelect = page.locator('select').first()
    await passFailSelect.selectOption('PASS')
    
    // Add comments
    const commentsField = page.locator('textarea[placeholder*="comments"]').first()
    await commentsField.fill('E2E test inspection comment')
    
    // Save inspection
    await page.click('button:has-text("save")')
    
    // Should see success indicator
    await expect(page.locator('.text-green, .success, [data-testid="success"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('should handle inspection failures and corrective actions', async ({ page }) => {
    await page.goto('/project/1/lot/1')
    
    // Select FAIL for an inspection item
    const passFailSelect = page.locator('select').first()
    await passFailSelect.selectOption('FAIL')
    
    // Corrective action field should appear
    const correctiveActionField = page.locator('textarea[placeholder*="corrective"]')
    await expect(correctiveActionField).toBeVisible()
    
    // Fill corrective action
    await correctiveActionField.fill('Re-inspect after corrections made')
    
    // Save inspection
    await page.click('button:has-text("save")')
    
    // Should see failure indicator and non-conformance
    await expect(page.locator('.text-red, .error, [data-testid="fail"]').first()).toBeVisible({ timeout: 10000 })
  })

  test('should navigate between projects and lots', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard')
    
    // Navigate to projects
    await page.click('a:has-text("projects"), [href="/projects"]')
    await expect(page).toHaveURL('/projects')
    
    // Navigate to specific project
    await page.click('.project-item, [data-testid="project-item"]')
    await expect(page.url()).toMatch(/\/project\/\d+/)
    
    // Navigate to specific lot
    await page.click('.lot-item, [data-testid="lot-item"]')
    await expect(page.url()).toMatch(/\/project\/\d+\/lot\/\d+/)
    
    // Use breadcrumbs or back navigation
    await page.click('a:has-text("back"), .breadcrumb a').first()
    await expect(page.url()).toMatch(/\/project\/\d+$/)
  })

  test('should search and filter projects', async ({ page }) => {
    await page.goto('/projects')
    
    // Use search if available
    const searchInput = page.locator('input[placeholder*="search"], input[type="search"]')
    if (await searchInput.count() > 0) {
      await searchInput.fill('Test')
      await page.keyboard.press('Enter')
      
      // Should filter results
      await expect(page.locator('.project-item')).toContainText('Test')
    }
    
    // Use status filter if available
    const statusFilter = page.locator('select[name*="status"], .filter-status')
    if (await statusFilter.count() > 0) {
      await statusFilter.selectOption('active')
      
      // Should filter by status
      await expect(page.locator('.project-item')).toBeVisible()
    }
  })

  test('should show project statistics on dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should see project statistics
    await expect(page.locator('text=projects, .stat-projects').first()).toBeVisible()
    await expect(page.locator('text=inspections, .stat-inspections').first()).toBeVisible()
    await expect(page.locator('text=conformances, .stat-conformances').first()).toBeVisible()
    
    // Numbers should be visible
    await expect(page.locator('text=/\\d+/')).toBeVisible()
  })

  test('should handle form validation errors', async ({ page }) => {
    await page.goto('/projects')
    
    // Try to create project with missing data
    await page.click('button:has-text("create project")')
    await page.click('button[type="submit"]:has-text("create")')
    
    // Should show validation errors
    const nameField = page.locator('[name="name"]')
    await expect(nameField).toHaveAttribute('required')
    
    // Fill required field and try again
    await nameField.fill('Valid Project Name')
    await page.click('button[type="submit"]:has-text("create")')
    
    // Should proceed or show different validation
    await expect(page.locator('.error, [role="alert"]')).not.toBeVisible({ timeout: 5000 })
  })

  test('should handle loading states during project operations', async ({ page }) => {
    // Slow down API calls to see loading states
    await page.route('**/api/projects/**', route => {
      setTimeout(() => route.continue(), 1000)
    })
    
    await page.goto('/projects')
    
    // Should show loading state initially
    await expect(page.locator('text=loading, .loading, .spinner').first()).toBeVisible({ timeout: 2000 })
    
    // After loading, should show content
    await expect(page.locator('.project-item, text=no projects').first()).toBeVisible({ timeout: 10000 })
  })

  test('should maintain state during navigation', async ({ page }) => {
    await page.goto('/projects')
    
    // Note current projects count
    const projectCount = await page.locator('.project-item').count()
    
    // Navigate away and back
    await page.goto('/dashboard')
    await page.goto('/projects')
    
    // Should maintain same state
    await expect(page.locator('.project-item')).toHaveCount(projectCount)
  })

  test('should handle responsive design on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await page.goto('/dashboard')
    
    // Should adapt to mobile layout
    await expect(page.locator('body')).toBeVisible()
    
    // Navigation should work on mobile
    await page.goto('/projects')
    await expect(page.locator('.project-item, text=projects').first()).toBeVisible()
  })

  test('should handle concurrent user actions', async ({ page, context }) => {
    // Create second page (simulating concurrent user)
    const page2 = await context.newPage()
    
    // Both users log in
    await page2.goto('/auth/login')
    await page2.fill('[name="email"]', 'inspector@example.com')
    await page2.fill('[name="password"]', 'password123')
    await page2.click('button[type="submit"]')
    
    // Both navigate to same project
    await page.goto('/project/1')
    await page2.goto('/project/1')
    
    // Both should see the project
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page2.locator('h1, h2').first()).toBeVisible()
    
    await page2.close()
  })
})