import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/dashboard')
    
    // Should be redirected to login page
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should allow user to sign up', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Fill signup form
    await page.fill('[name="firstName"]', 'Test')
    await page.fill('[name="lastName"]', 'User')
    await page.fill('[name="email"]', `test${Date.now()}@example.com`)
    await page.fill('[name="password"]', 'SecurePassword123!')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard on success
    await expect(page).toHaveURL('/dashboard')
    
    // Should see user content
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should allow user to log in', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Fill login form with existing user credentials
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard on success
    await expect(page).toHaveURL('/dashboard')
    
    // Should see user content
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should show error for invalid login credentials', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Fill login form with invalid credentials
    await page.fill('[name="email"]', 'invalid@example.com')
    await page.fill('[name="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('[role="alert"], .error, .text-red')).toBeVisible()
    
    // Should remain on login page
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should validate required fields', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Try to submit empty form
    await page.click('button[type="submit"]')
    
    // Browser validation should prevent submission
    const emailInput = page.locator('[name="email"]')
    const passwordInput = page.locator('[name="password"]')
    
    await expect(emailInput).toHaveAttribute('required')
    await expect(passwordInput).toHaveAttribute('required')
  })

  test('should allow user to log out', async ({ page }) => {
    // First, log in
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    
    // Find and click logout button (might be in a menu)
    const logoutButton = page.locator('button:has-text("logout"), button:has-text("sign out"), [data-testid="logout"]').first()
    await logoutButton.click()
    
    // Should redirect to login page
    await expect(page).toHaveURL(/.*\/auth\/login/)
    
    // Should not be able to access dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should maintain session across page reloads', async ({ page }) => {
    // Log in
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Reload page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('should handle signup form validation', async ({ page }) => {
    await page.goto('/auth/signup')
    
    // Test invalid email
    await page.fill('[name="email"]', 'invalid-email')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show validation error or prevent submission
    const emailInput = page.locator('[name="email"]')
    await expect(emailInput).toHaveAttribute('type', 'email')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept auth requests to simulate network error
    await page.route('**/api/auth/login', route => {
      route.abort('failed')
    })
    
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // Should show error message or handle gracefully
    // The exact behavior depends on implementation
    await expect(page.locator('text=error, text=failed, [role="alert"]').first()).toBeVisible({ timeout: 5000 })
  })

  test('should show loading states during authentication', async ({ page }) => {
    // Slow down the auth request to see loading state
    await page.route('**/api/auth/login', route => {
      setTimeout(() => route.continue(), 1000)
    })
    
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    
    const submitButton = page.locator('button[type="submit"]')
    await submitButton.click()
    
    // Should show loading state
    await expect(submitButton).toBeDisabled()
    // Could also check for loading text or spinner
    await expect(page.locator('text=signing in, text=loading, .spinner').first()).toBeVisible({ timeout: 2000 })
  })

  test('should navigate between login and signup pages', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Click link to signup
    await page.click('a:has-text("sign up"), a:has-text("create account")')
    await expect(page).toHaveURL(/.*\/auth\/signup/)
    
    // Click link back to login
    await page.click('a:has-text("sign in"), a:has-text("login")')
    await expect(page).toHaveURL(/.*\/auth\/login/)
  })

  test('should remember form data on page refresh', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Fill form
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    
    // Refresh page
    await page.reload()
    
    // Form should be cleared (this is the expected security behavior)
    await expect(page.locator('[name="email"]')).toHaveValue('')
    await expect(page.locator('[name="password"]')).toHaveValue('')
  })

  test('should handle browser back button correctly', async ({ page }) => {
    // Log in
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'admin@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    await expect(page).toHaveURL('/dashboard')
    
    // Navigate to another page
    await page.goto('/projects')
    
    // Use browser back button
    await page.goBack()
    
    // Should be back on dashboard, still authenticated
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
})