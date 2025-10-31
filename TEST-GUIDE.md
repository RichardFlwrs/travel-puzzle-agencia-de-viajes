# Testing Guide for TravelPuzzle

## Overview

This project uses **Jest** as the testing framework with support for TypeScript, React Testing Library, and Next.js.

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (for continuous integration)
npm run test:ci
```

### Running Specific Tests

```bash
# Run a specific test file
npm test -- freetour-adapter.test.ts

# Run tests matching a pattern
npm test -- --testPathPattern=adapters

# Run tests by name
npm test -- --testNamePattern="authentication"
```

## Test Structure

### Test Organization

```
src/
├── lib/
│   ├── __mocks__/           # Mock implementations
│   │   ├── prisma.ts        # Mocked Prisma client
│   │   └── redis.ts         # Mocked Redis client
│   ├── adapters/
│   │   └── __tests__/       # Adapter tests
│   │       ├── test-utils.ts
│   │       └── freetour-adapter.test.ts
│   └── services/
│       └── __tests__/       # Service tests
│           ├── tour-aggregator.test.ts
│           └── location-mapper.test.ts
└── __tests__/
    └── integration/         # Integration tests
        └── adapter-flow.test.ts
```

## What's Being Tested

### 1. FreeTour Adapter (`freetour-adapter.test.ts`)

Tests the FreeTour API integration including:

- **Authentication**
  - ✅ Initial authentication on first API call
  - ✅ Token reuse for subsequent calls
  - ✅ Token refresh when expired
  - ✅ Authentication failure handling
  - ✅ 401 retry with token refresh

- **Data Transformation**
  - ✅ FreeTour API response → NormalizedTour format
  - ✅ Price formatting (€25.50, $30.00, etc.)
  - ✅ Duration normalization ("2:30" → "2.5 hours")
  - ✅ Missing optional fields handling
  - ✅ Multilingual field selection
  - ✅ Language fallback to English

- **Query Translation**
  - ✅ UnifiedQuery → FreeTour API parameters
  - ✅ Pagination parameters

- **Error Handling**
  - ✅ API errors
  - ✅ Network failures
  - ✅ Invalid responses

### 2. Tour Aggregator (`tour-aggregator.test.ts`)

Tests multi-provider orchestration including:

- **Single Provider**
  - ✅ Fetch tours from one adapter
  - ✅ Empty results handling

- **Multiple Providers**
  - ✅ Merge tours from multiple adapters
  - ✅ Parallel adapter calls (performance)
  - ✅ Source identification

- **Error Handling**
  - ✅ Continue when one provider fails
  - ✅ All providers failing
  - ✅ Error recording and reporting

- **Deduplication**
  - ✅ Remove duplicates from same source
  - ✅ Keep tours from different sources

- **Sorting**
  - ✅ Sort by price (ascending/descending)
  - ✅ Sort by rating
  - ✅ Sort by duration
  - ✅ Default sorting

- **Pagination**
  - ✅ Page 1 results
  - ✅ Page 2+ results
  - ✅ Last page with fewer items
  - ✅ Correct total counts and page numbers

### 3. Location Mapper (`location-mapper.test.ts`)

Tests ID mapping between providers including:

- **Provider ID Lookup**
  - ✅ ISO code → provider ID (countries)
  - ✅ City name → provider ID (with country context)
  - ✅ Non-existent mappings
  - ✅ Redis caching

- **Canonical Identifier Lookup**
  - ✅ Provider ID → ISO code
  - ✅ Provider ID → canonical name
  - ✅ Non-existent provider IDs

- **Mapping Upsert**
  - ✅ Create new mappings
  - ✅ Update existing mappings
  - ✅ Cache invalidation after upsert

### 4. Integration Tests (`adapter-flow.test.ts`)

End-to-end tests covering:

- **Complete Adapter Flow**
  - ✅ Auth → Fetch → Transform chain
  - ✅ Language selection throughout flow
  - ✅ Data structure validation

- **Multi-Provider Aggregation**
  - ✅ FreeTour + Viator together
  - ✅ Partial provider failures
  - ✅ Result merging

- **Data Compatibility**
  - ✅ All adapters return same structure
  - ✅ Required fields present
  - ✅ Correct data types

## Test Coverage Goals

| Component | Target Coverage |
|-----------|----------------|
| Adapters | 90%+ |
| Services | 85%+ |
| Utils | 80%+ |
| Overall | 80%+ |

## Mocking Strategy

### Prisma Database

- Uses `src/lib/__mocks__/prisma.ts`
- All database operations are mocked
- Returns predictable test data
- No actual database connections

### Redis Cache

- Uses `src/lib/__mocks__/redis.ts`
- In-memory cache simulation
- TTL expiration support
- Clear between tests

### External APIs

- Uses `jest.fn()` for `fetch`
- Controlled responses
- Simulates success and failure cases
- No real API calls during tests

### Environment Variables

- Mocked in `jest.setup.js`
- Consistent test environment
- No `.env` file needed for tests

## Writing New Tests

### Basic Test Structure

```typescript
import { YourComponent } from '../your-component';
import { createSampleData } from './test-utils';

jest.mock('@/lib/prisma');
jest.mock('@/lib/cache/redis');

describe('YourComponent', () => {
  beforeEach(() => {
    // Setup before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = createSampleData();
      
      // Act
      const result = await yourFunction(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### Test Utilities

Use test utilities from `src/lib/adapters/__tests__/test-utils.ts`:

```typescript
import {
  createSampleQuery,
  createSampleTour,
  createMockFreeTourResponse,
  createMockFetchResponse,
  waitForPromises,
} from './test-utils';

// Create a sample unified query
const query = createSampleQuery({ countryCode: 'IT', page: 2 });

// Create a sample normalized tour
const tour = createSampleTour({ source: 'viator', price: { amount: 30 } });

// Create a mock API response
const apiResponse = createMockFreeTourResponse(5); // 5 tours
```

## Debugging Tests

### Run Single Test in Watch Mode

```bash
npm run test:watch -- freetour-adapter.test.ts
```

### Enable Console Logs

Uncomment `console.log` in `jest.setup.js` to see debug output.

### VS Code Debugging

Add to `.vscode/launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Continuous Integration

Tests run automatically on:

- Pull requests
- Commits to main branch
- Pre-deployment checks

CI command:

```bash
npm run test:ci
```

This runs tests with:
- Coverage reporting
- Parallel execution limited to 2 workers
- CI mode (no watch)
- Fail fast on errors

## Best Practices

1. **Test Naming**: Use descriptive `it('should ...')` statements
2. **Arrange-Act-Assert**: Structure tests clearly
3. **One Assertion Per Test**: Focus tests on single behaviors
4. **Mock External Dependencies**: Use mocks for APIs, DB, etc.
5. **Clean Up**: Reset mocks between tests
6. **Test Edge Cases**: Empty data, errors, nulls, etc.
7. **Keep Tests Fast**: No real API calls or DB queries
8. **Document Complex Tests**: Add comments for non-obvious logic

## Common Issues

### Issue: Tests timing out

**Solution**: Check for missing `await` or unresolved promises.

### Issue: Mock not working

**Solution**: Ensure mock is defined before importing the module:

```typescript
jest.mock('@/lib/prisma'); // Before other imports
import { myFunction } from './my-module';
```

### Issue: Tests passing locally but failing in CI

**Solution**: Check for:
- Environment-specific configurations
- Timing issues (use `waitForPromises()`)
- File path differences (case sensitivity)

## Next Steps

- [ ] Add tests for `cached-tour-service.ts`
- [ ] Add tests for API routes (`/api/tours/aggregate`)
- [ ] Add tests for React components (TourCard, TourFiltersPanel)
- [ ] Increase coverage to 80%+
- [ ] Add E2E tests with Playwright or Cypress

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/testing)

