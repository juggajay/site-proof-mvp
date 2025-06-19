# Site-Proof MVP Testing Guide

This document provides comprehensive information about the testing strategy, setup, and execution for the Site-Proof MVP application.

## 📋 Table of Contents

- [Overview](#overview)
- [Testing Strategy](#testing-strategy)
- [Setup](#setup)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing Tests](#writing-tests)
- [Coverage Reports](#coverage-reports)
- [Continuous Integration](#continuous-integration)
- [Troubleshooting](#troubleshooting)

## 🔍 Overview

The Site-Proof MVP uses a comprehensive testing approach with three main testing layers:

1. **Unit Tests** - Testing individual components and functions
2. **Integration Tests** - Testing API routes and server actions
3. **End-to-End Tests** - Testing complete user workflows

### Testing Stack

- **Jest** - Test runner and assertion library
- **React Testing Library** - React component testing utilities
- **Playwright** - End-to-end testing framework
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Additional Jest matchers

## 🎯 Testing Strategy

### Unit Testing
- **Authentication Context** - State management, login/logout flows
- **Form Components** - Validation, submission, error handling
- **Modal Components** - Open/close behavior, form integration
- **Utility Functions** - Data processing, helpers

### Integration Testing
- **API Routes** - Request/response handling, authentication
- **Server Actions** - Data mutations, error handling
- **Database Operations** - CRUD operations (with mock data)

### End-to-End Testing
- **Authentication Flow** - Complete login/signup/logout process
- **Project Management** - Creating projects, lots, inspections
- **Navigation** - Routing, breadcrumbs, protected routes
- **Error Handling** - Network failures, validation errors

## 🚀 Setup

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup test environment:
```bash
node scripts/test-runner.js setup
```

This will:
- Install all testing dependencies
- Install Playwright browsers
- Verify the test setup

### Manual Setup

If you prefer manual setup:

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test jest-environment-jsdom

# Install Playwright browsers
npx playwright install
```

## 🧪 Running Tests

### Quick Start

```bash
# Run all tests
node scripts/test-runner.js all

# Run unit tests only
npm run test

# Run E2E tests only
npm run test:e2e
```

### Detailed Commands

#### Unit Tests
```bash
# Run once
npm run test

# Watch mode (re-runs on file changes)
npm run test:watch

# With coverage report
npm run test:coverage

# Run specific test file
npm run test auth-context.test.tsx

# Run tests matching pattern
npm run test -- --testNamePattern="login"
```

#### End-to-End Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test auth.spec.ts

# Run with debugging
npx playwright test --debug

# Generate test report
npx playwright show-report
```

#### Using Test Runner Script
```bash
# Show available commands
node scripts/test-runner.js help

# Setup environment
node scripts/test-runner.js setup

# Run unit tests with coverage
node scripts/test-runner.js unit:coverage

# Run E2E tests in headed mode
node scripts/test-runner.js e2e:headed

# Clean test artifacts
node scripts/test-runner.js clean
```

## 📁 Test Structure

```
├── __tests__/                 # Unit and integration tests
│   ├── utils/                 # Test utilities and helpers
│   │   ├── test-utils.tsx     # React Testing Library setup
│   │   └── mock-data.ts       # Mock data for testing
│   ├── contexts/              # Context testing
│   │   └── auth-context.test.tsx
│   ├── pages/                 # Page component tests
│   │   └── auth/
│   │       ├── login.test.tsx
│   │       └── signup.test.tsx
│   ├── components/            # Component tests
│   │   ├── modals/
│   │   │   └── create-project-modal.test.tsx
│   │   └── forms/
│   │       └── inspection-checklist-form.test.tsx
│   ├── api/                   # API route tests
│   │   └── auth/
│   │       └── login.test.ts
│   └── lib/                   # Library/utility tests
│       └── actions.test.ts
├── e2e/                       # End-to-end tests
│   ├── auth.spec.ts
│   └── project-workflow.spec.ts
├── jest.config.js             # Jest configuration
├── jest.setup.js              # Jest setup file
├── playwright.config.ts       # Playwright configuration
└── scripts/
    └── test-runner.js         # Custom test runner
```

## ✍️ Writing Tests

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateProjectModal } from '@/components/modals/create-project-modal'
import { renderWithAuth } from '../utils/test-utils'

describe('CreateProjectModal', () => {
  it('should create project on form submission', async () => {
    const { user } = renderWithAuth(
      <CreateProjectModal isOpen={true} onClose={jest.fn()} onProjectCreated={jest.fn()} />
    )
    
    await user.type(screen.getByLabelText(/project name/i), 'Test Project')
    await user.click(screen.getByRole('button', { name: /create/i }))
    
    expect(screen.getByText(/creating/i)).toBeInTheDocument()
  })
})
```

### Integration Test Example

```typescript
import { POST } from '@/app/api/auth/login/route'
import { NextRequest } from 'next/server'

describe('/api/auth/login', () => {
  it('should handle successful login', async () => {
    const request = new NextRequest('http://localhost/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    })
    
    const response = await POST(request)
    expect(response.status).toBe(200)
  })
})
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test'

test('user can log in and create project', async ({ page }) => {
  await page.goto('/auth/login')
  await page.fill('[name="email"]', 'admin@example.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/dashboard')
  
  await page.goto('/projects')
  await page.click('button:has-text("Create Project")')
  await page.fill('[name="name"]', 'E2E Test Project')
  await page.click('button[type="submit"]')
  
  await expect(page.locator('text=E2E Test Project')).toBeVisible()
})
```

### Test Utilities

Use the provided test utilities for consistent testing:

```typescript
import { renderWithAuth, testHelpers, mockApiResponses } from '../utils/test-utils'

// Render component with authentication context
const { user } = renderWithAuth(<Component />, { user: mockUser })

// Use helper functions
await testHelpers.fillForm({ name: 'Test', email: 'test@example.com' })
await testHelpers.submitForm('Create')
testHelpers.expectSuccess('Project created')

// Mock API responses
mockFetch(mockApiResponses.success({ id: 1 }))
mockFetch(mockApiResponses.error('Validation failed', 400))
```

## 📊 Coverage Reports

### Generating Coverage

```bash
npm run test:coverage
```

### Coverage Thresholds

Current coverage thresholds (configured in `jest.config.js`):
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Viewing Coverage

Coverage reports are generated in the `coverage/` directory:
- `coverage/lcov-report/index.html` - HTML report
- `coverage/lcov.info` - LCOV format for CI tools

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npx playwright install
      - run: npm run test:e2e
```

### Pre-commit Hooks

Add to `.husky/pre-commit`:
```bash
npm run test
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

#### Jest Issues

**Issue**: Tests fail with module resolution errors
```
Solution: Check jest.config.js moduleNameMapping configuration
```

**Issue**: React Testing Library warnings
```
Solution: Ensure proper cleanup in jest.setup.js
```

#### Playwright Issues

**Issue**: Browser not found
```bash
Solution: Run `npx playwright install`
```

**Issue**: Tests timeout
```
Solution: Increase timeout in playwright.config.ts or use waitFor with longer timeout
```

#### Authentication Issues

**Issue**: Auth context not available in tests
```
Solution: Use renderWithAuth utility instead of render
```

**Issue**: Protected routes not working in tests
```
Solution: Mock Next.js router in jest.setup.js
```

### Debug Commands

```bash
# Run Jest in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run Playwright with debug
npx playwright test --debug

# Run specific test with verbose output
npm run test -- --verbose auth-context.test.tsx
```

### Environment Variables

For testing, ensure these environment variables are set:
```bash
JWT_SECRET=test-jwt-secret-key
NODE_ENV=test
```

## 📚 Best Practices

### Unit Tests
1. Test behavior, not implementation
2. Use descriptive test names
3. Follow AAA pattern (Arrange, Act, Assert)
4. Mock external dependencies
5. Test edge cases and error conditions

### Integration Tests
1. Test the complete request/response cycle
2. Use realistic test data
3. Test authentication and authorization
4. Verify error handling

### E2E Tests
1. Test critical user journeys
2. Use stable selectors
3. Make tests independent
4. Clean up test data
5. Use Page Object Model for complex flows

### General
1. Keep tests focused and small
2. Use factories for test data
3. Document complex test scenarios
4. Run tests in CI/CD pipeline
5. Maintain test coverage above 70%

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests cover happy path and edge cases
3. Update test documentation if needed
4. Verify all tests pass before submitting PR

For questions or issues with testing, please refer to the project's issue tracker or contact the development team.