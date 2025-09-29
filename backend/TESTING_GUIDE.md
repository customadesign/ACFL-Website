# Backend Testing Guide

## Overview
This guide covers white-box testing for the ACFL Website backend API using Jest and Supertest.

## Test Structure

```
backend/src/tests/
├── auth.test.ts           # Unit tests for authentication controller
├── admin.test.ts          # Unit tests for admin routes
├── api.integration.test.ts # Integration tests for API endpoints
├── matchingService.test.ts # Unit tests for matching service
└── setup.ts               # Test configuration and setup
```

## Running Tests

### All Tests
```bash
npm test
```

### Test with Coverage Report
```bash
npm run test:coverage
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Specific Test Suites
```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only auth tests
npm run test:auth

# Run only admin tests
npm run test:admin

# Run with verbose output
npm run test:verbose
```

## Test Types

### 1. Unit Tests
Tests individual functions and components in isolation using mocks.

**Example: Authentication Controller Tests**
- Login validation
- Password verification
- Token generation
- User status checks (suspended, inactive, etc.)
- Error handling

### 2. Integration Tests
Tests API endpoints with real HTTP requests using Supertest.

**Example: API Endpoint Tests**
- Request/response format validation
- Authentication middleware
- Authorization checks
- CORS configuration
- Error handling
- Security (SQL injection, XSS prevention)

### 3. Coverage Areas

#### Authentication (`auth.test.ts`)
✅ Login with valid credentials
✅ Login with invalid credentials
✅ Account status validation (suspended, inactive, pending)
✅ Role-based authentication (client, coach, admin, staff)
✅ Registration validation
✅ Password hashing and verification
✅ JWT token generation

#### Admin Routes (`admin.test.ts`)
✅ User fetching with filters
✅ Role and status filtering
✅ Database error handling
✅ Authorization checks
✅ Data transformation and formatting

#### API Integration (`api.integration.test.ts`)
✅ HTTP request/response validation
✅ Authentication header parsing
✅ CORS preflight handling
✅ Input validation
✅ Error response formats
✅ Security testing (injection attacks, XSS)
✅ Large payload handling

## Mocking Strategy

### Database Mocks
```typescript
const supabaseMock = supabase as any;
supabaseMock.from = jest.fn().mockReturnValue({
  select: jest.fn().mockResolvedValue({ data: mockData, error: null })
});
```

### Authentication Mocks
```typescript
(bcrypt.compare as jest.Mock).mockResolvedValue(true);
(jwt.sign as jest.Mock).mockReturnValue('mock-token');
```

## Test Environment Setup

### Environment Variables
Create a `.env.test` file:
```env
NODE_ENV=test
JWT_SECRET=test-secret-key
BCRYPT_ROUNDS=10
```

### Jest Configuration
The `jest.config.js` file configures:
- TypeScript support via ts-jest
- Code coverage reporting
- Test file patterns
- Module path mappings

## Writing New Tests

### Unit Test Template
```typescript
describe('Component Name', () => {
  let mockDependency: jest.Mock;

  beforeEach(() => {
    // Setup mocks
    mockDependency = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should do something', async () => {
    // Arrange
    const input = 'test';
    mockDependency.mockResolvedValue('result');

    // Act
    const result = await functionUnderTest(input);

    // Assert
    expect(result).toBe('expected');
    expect(mockDependency).toHaveBeenCalledWith(input);
  });
});
```

### Integration Test Template
```typescript
describe('API Endpoint', () => {
  test('should return 200 for valid request', async () => {
    const response = await request(app)
      .post('/api/endpoint')
      .set('Authorization', 'Bearer token')
      .send({ data: 'test' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true
    });
  });
});
```

## Coverage Goals

Aim for:
- **Overall Coverage**: >80%
- **Critical Paths**: 100% (auth, payments)
- **Error Handling**: 100%
- **Edge Cases**: >90%

## Debugging Tests

### Run specific test file
```bash
npm test -- auth.test.ts
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should login"
```

### Debug with console logs
Set `DEBUG_TESTS=true` to enable console output:
```bash
DEBUG_TESTS=true npm test
```

## CI/CD Integration

Add to your CI pipeline:
```yaml
- name: Run tests
  run: |
    npm install
    npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Common Test Scenarios

### Testing Authentication Flow
1. Valid credentials → Success + Token
2. Invalid email → 401 Error
3. Wrong password → 401 Error
4. Suspended account → 403 Error
5. Missing fields → 400 Validation Error

### Testing API Endpoints
1. No auth token → 401 Unauthorized
2. Invalid token → 401 Unauthorized
3. Wrong role → 403 Forbidden
4. Valid request → 200 Success
5. Database error → 500 Internal Error

### Testing Data Validation
1. Missing required fields → 400 Bad Request
2. Invalid email format → 400 Validation Error
3. Weak password → 400 Validation Error
4. SQL injection attempt → Safely handled
5. XSS attempt → Sanitized

## Troubleshooting

### Common Issues

1. **"Cannot find module"**: Check TypeScript paths in tsconfig.json
2. **"Timeout exceeded"**: Increase timeout in jest.config.js
3. **"Mock not working"**: Ensure mocks are before imports
4. **"Database connection"**: Mock Supabase client properly

### Best Practices

1. **Isolate tests**: Each test should be independent
2. **Use descriptive names**: Test names should explain what they test
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Don't make real API/DB calls
5. **Test edge cases**: Empty arrays, null values, large data
6. **Clean up**: Clear mocks and restore state after tests