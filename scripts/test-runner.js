#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function runCommand(command, description) {
  log(`\n📦 ${description}`, 'cyan')
  log(`Running: ${command}`, 'yellow')
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    log(`✅ ${description} completed successfully`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    log(`Error: ${error.message}`, 'red')
    return false
  }
}

function checkFileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath))
}

function showTestSummary() {
  log('\n📊 Test Suite Summary', 'bright')
  log('=' * 50, 'cyan')
  
  const testFiles = [
    '__tests__/contexts/auth-context.test.tsx',
    '__tests__/pages/auth/login.test.tsx',
    '__tests__/pages/auth/signup.test.tsx',
    '__tests__/components/modals/create-project-modal.test.tsx',
    '__tests__/components/forms/inspection-checklist-form.test.tsx',
    '__tests__/api/auth/login.test.ts',
    '__tests__/lib/actions.test.ts',
    'e2e/auth.spec.ts',
    'e2e/project-workflow.spec.ts',
  ]
  
  log('\n📁 Available Test Files:', 'blue')
  testFiles.forEach(file => {
    const exists = checkFileExists(file)
    const status = exists ? '✅' : '❌'
    const color = exists ? 'green' : 'red'
    log(`  ${status} ${file}`, color)
  })
  
  log('\n🧪 Test Categories:', 'blue')
  log('  • Unit Tests: Component and function testing')
  log('  • Integration Tests: API and server action testing')
  log('  • E2E Tests: Full user workflow testing')
  
  log('\n📋 Coverage Areas:', 'blue')
  log('  • Authentication system (context, pages, API)')
  log('  • Form components (modals, validation)')
  log('  • Project management workflow')
  log('  • Server actions and API routes')
  log('  • Error handling and edge cases')
}

function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  
  log('🧪 Site-Proof MVP Test Runner', 'bright')
  log('================================', 'cyan')
  
  switch (command) {
    case 'install':
      log('\n📦 Installing test dependencies...', 'cyan')
      runCommand('npm install', 'Installing dependencies')
      break
      
    case 'unit':
      log('\n🔬 Running unit tests...', 'cyan')
      runCommand('npm run test', 'Unit tests')
      break
      
    case 'unit:watch':
      log('\n🔬 Running unit tests in watch mode...', 'cyan')
      runCommand('npm run test:watch', 'Unit tests (watch mode)')
      break
      
    case 'unit:coverage':
      log('\n📊 Running unit tests with coverage...', 'cyan')
      runCommand('npm run test:coverage', 'Unit tests with coverage')
      break
      
    case 'e2e':
      log('\n🌐 Running end-to-end tests...', 'cyan')
      if (!checkFileExists('playwright.config.ts')) {
        log('❌ Playwright config not found. Run "npx playwright install" first.', 'red')
        return
      }
      runCommand('npm run test:e2e', 'End-to-end tests')
      break
      
    case 'e2e:headed':
      log('\n🌐 Running end-to-end tests in headed mode...', 'cyan')
      runCommand('npx playwright test --headed', 'E2E tests (headed)')
      break
      
    case 'all':
      log('\n🚀 Running all tests...', 'cyan')
      
      const unitSuccess = runCommand('npm run test', 'Unit tests')
      if (!unitSuccess) {
        log('\n❌ Unit tests failed. Skipping E2E tests.', 'red')
        return
      }
      
      const e2eSuccess = runCommand('npm run test:e2e', 'End-to-end tests')
      
      if (unitSuccess && e2eSuccess) {
        log('\n🎉 All tests passed!', 'green')
      } else {
        log('\n❌ Some tests failed.', 'red')
      }
      break
      
    case 'lint':
      log('\n🔍 Running linter...', 'cyan')
      runCommand('npm run lint', 'ESLint')
      break
      
    case 'setup':
      log('\n⚙️  Setting up test environment...', 'cyan')
      
      // Install dependencies
      runCommand('npm install', 'Installing dependencies')
      
      // Install Playwright browsers
      runCommand('npx playwright install', 'Installing Playwright browsers')
      
      // Run a quick test to verify setup
      runCommand('npm run test -- --passWithNoTests', 'Verifying test setup')
      
      log('\n✅ Test environment setup complete!', 'green')
      log('\nNext steps:', 'cyan')
      log('  • Run "npm run test" for unit tests')
      log('  • Run "npm run test:e2e" for end-to-end tests')
      log('  • Run "node scripts/test-runner.js all" for complete test suite')
      break
      
    case 'clean':
      log('\n🧹 Cleaning test artifacts...', 'cyan')
      runCommand('rm -rf coverage/', 'Removing coverage directory')
      runCommand('rm -rf test-results/', 'Removing test results')
      runCommand('rm -rf playwright-report/', 'Removing Playwright reports')
      log('✅ Test artifacts cleaned', 'green')
      break
      
    case 'summary':
      showTestSummary()
      break
      
    case 'help':
    default:
      log('\n📖 Available Commands:', 'blue')
      log('  install       Install test dependencies')
      log('  unit          Run unit tests')
      log('  unit:watch    Run unit tests in watch mode')
      log('  unit:coverage Run unit tests with coverage report')
      log('  e2e           Run end-to-end tests')
      log('  e2e:headed    Run E2E tests in headed mode')
      log('  all           Run all tests (unit + e2e)')
      log('  lint          Run ESLint')
      log('  setup         Setup complete test environment')
      log('  clean         Clean test artifacts')
      log('  summary       Show test suite summary')
      log('  help          Show this help message')
      
      log('\n💡 Examples:', 'yellow')
      log('  node scripts/test-runner.js setup')
      log('  node scripts/test-runner.js unit:coverage')
      log('  node scripts/test-runner.js all')
      
      log('\n📚 Documentation:', 'blue')
      log('  • Jest: https://jestjs.io/docs/getting-started')
      log('  • React Testing Library: https://testing-library.com/docs/react-testing-library/intro')
      log('  • Playwright: https://playwright.dev/docs/intro')
      break
  }
  
  log('\n')
}

if (require.main === module) {
  main()
}

module.exports = { runCommand, checkFileExists, log }