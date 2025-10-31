// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock environment variables for testing
process.env.FREETOUR_EMAIL = 'test@example.com'
process.env.FREETOUR_PASSWORD = 'test-password'
process.env.VIATOR_API_KEY = 'test-viator-key'
process.env.UPSTASH_REDIS_REST_URL = 'http://localhost:6379'
process.env.UPSTASH_REDIS_REST_TOKEN = 'test-token'
process.env.CACHE_TTL_TOURS = '300'
process.env.CACHE_TTL_FILTERS = '1800'
process.env.CACHE_TTL_METADATA = '60'
process.env.CACHE_TTL_AUTH = '3600'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for debugging failing tests
  error: console.error,
}

