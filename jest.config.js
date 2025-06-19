const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const jestConfig = createJestConfig({
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
})

module.exports = jestConfig