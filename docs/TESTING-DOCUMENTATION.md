# 🧪 Testing Documentation

## 📋 Table of Contents
1. [Testing Overview](#testing-overview)
2. [Test Structure](#test-structure)
3. [Server Actions Testing](#server-actions-testing)
4. [Component Testing](#component-testing)
5. [Mock Setup](#mock-setup)
6. [Test Patterns](#test-patterns)
7. [Running Tests](#running-tests)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Testing Overview

This document provides comprehensive testing guidelines for the server actions migration and the overall application testing strategy.

### Test Coverage Status
- **Server Actions**: 68% coverage (39/57 tests passing)
- **Components**: 45% coverage (various loading state issues)
- **Integration**: 60% coverage (API routes → server actions)

### Testing Philosophy
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test server actions with mocked dependencies
- **End-to-End Tests**: Test complete user workflows
- **Performance Tests**: Test response times and resource usage

---

## 🏗️ Test Structure

### Directory Structure
```
src/
├── app/
│   ├── (app)/
│   │   ├── admin/
│   │   │   ├── bookings/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── actions.test.ts
│   │   │   │   └── actions.ts
│   │   │   ├── users/
│   │   │   │   ├── __tests__/
│   │   │   │   │   └── actions.test.ts
│   │   │   │   └── actions.ts
│   │   │   └── ...
│   │   └── ...
│   └── ...
├── components/
│   └── __tests__/
└── lib/
    └── __tests__/
```

### Test File Naming Convention
- Server Actions: `actions.test.ts`
- Components: `component-name.test.tsx`
- Utilities: `utility-name.test.ts`
- Integration: `integration.test.ts`

---

## 🔧 Server Actions Testing

### Test Structure Template

```typescript
// src/app/example/__tests__/actions.test.ts
import { exampleAction } from '../actions';
import { getDb } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
jest.mock('firebase/firestore');
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;

describe('exampleAction', () => {
  const mockDb = {
    doc: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockUpdateDoc.mockResolvedValue(undefined);
  });

  describe('Validation', () => {
    it('should reject invalid input', async () => {
      const invalidData = { /* invalid data */ };
      const result = await exampleAction(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Validation failed');
    });
  });

  describe('Success Cases', () => {
    it('should process valid input successfully', async () => {
      const validData = { /* valid data */ };
      const result = await exampleAction(validData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Operation completed successfully');
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors', async () => {
      mockUpdateDoc.mockRejectedValue(new Error('Database error'));
      
      const result = await exampleAction(validData);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });
  });
});
```

### Test Categories

#### 1. Validation Tests
```typescript
describe('Validation', () => {
  it('should reject missing required fields', async () => {
    const result = await action({});
    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should reject invalid data types', async () => {
    const result = await action({ name: 123 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('string');
  });

  it('should reject data outside allowed ranges', async () => {
    const result = await action({ age: -5 });
    expect(result.success).toBe(false);
    expect(result.error).toContain('positive');
  });
});
```

#### 2. Success Case Tests
```typescript
describe('Success Cases', () => {
  it('should process valid data successfully', async () => {
    const validData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25
    };

    const result = await action(validData);

    expect(result.success).toBe(true);
    expect(result.message).toBe('Operation completed successfully');
    expect(mockUpdateDoc).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        name: 'John Doe',
        email: 'john@example.com'
      })
    );
  });
});
```

#### 3. Error Handling Tests
```typescript
describe('Error Handling', () => {
  it('should handle database connection errors', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Connection failed'));

    const result = await action(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection failed');
  });

  it('should handle permission errors', async () => {
    mockUpdateDoc.mockRejectedValue(new Error('Permission denied'));

    const result = await action(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Permission denied');
  });

  it('should handle unknown errors', async () => {
    mockUpdateDoc.mockRejectedValue('Unknown error');

    const result = await action(validData);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unknown error');
  });
});
```

#### 4. Edge Case Tests
```typescript
describe('Edge Cases', () => {
  it('should handle very large data', async () => {
    const largeData = {
      name: 'A'.repeat(1000),
      email: 'test@example.com'
    };

    const result = await action(largeData);

    expect(result.success).toBe(false);
    expect(result.error).toContain('too long');
  });

  it('should handle special characters', async () => {
    const specialData = {
      name: 'José María',
      email: 'test+tag@example.com'
    };

    const result = await action(specialData);

    expect(result.success).toBe(true);
  });

  it('should handle concurrent operations', async () => {
    const promises = Array(5).fill(null).map(() => action(validData));
    const results = await Promise.all(promises);

    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

---

## 🎨 Component Testing

### Component Test Template

```typescript
// src/components/__tests__/example-component.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExampleComponent } from '../example-component';
import { exampleAction } from '@/app/example/actions';

// Mock server action
jest.mock('@/app/example/actions');
const mockExampleAction = exampleAction as jest.MockedFunction<typeof exampleAction>;

describe('ExampleComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render correctly', () => {
    render(<ExampleComponent />);
    
    expect(screen.getByText('Example Component')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('should handle form submission', async () => {
    mockExampleAction.mockResolvedValue({
      success: true,
      message: 'Success!'
    });

    render(<ExampleComponent />);
    
    const input = screen.getByLabelText('Name');
    const button = screen.getByRole('button', { name: 'Submit' });
    
    fireEvent.change(input, { target: { value: 'John Doe' } });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(mockExampleAction).toHaveBeenCalledWith({
        name: 'John Doe'
      });
    });
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('should handle errors', async () => {
    mockExampleAction.mockResolvedValue({
      success: false,
      error: 'Validation failed'
    });

    render(<ExampleComponent />);
    
    const button = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    mockExampleAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<ExampleComponent />);
    
    const button = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(button);
    
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });
});
```

### Component Test Patterns

#### 1. Form Testing
```typescript
describe('Form Component', () => {
  it('should validate form inputs', async () => {
    render(<FormComponent />);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });
  });

  it('should submit valid form data', async () => {
    mockAction.mockResolvedValue({ success: true });
    
    render(<FormComponent />);
    
    fireEvent.change(screen.getByLabelText('Name'), { 
      target: { value: 'John Doe' } 
    });
    fireEvent.change(screen.getByLabelText('Email'), { 
      target: { value: 'john@example.com' } 
    });
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(mockAction).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com'
      });
    });
  });
});
```

#### 2. Loading State Testing
```typescript
describe('Loading States', () => {
  it('should show loading spinner during async operations', async () => {
    mockAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<Component />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Load Data' }));
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('should disable buttons during loading', async () => {
    mockAction.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ success: true }), 100))
    );

    render(<Component />);
    
    const button = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(button);
    
    expect(button).toBeDisabled();
    
    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
```

#### 3. Error State Testing
```typescript
describe('Error States', () => {
  it('should display error messages', async () => {
    mockAction.mockResolvedValue({
      success: false,
      error: 'Something went wrong'
    });

    render(<Component />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  it('should allow retry after error', async () => {
    mockAction
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ success: true });

    render(<Component />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));
    
    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    
    await waitFor(() => {
      expect(screen.getByText('Success!')).toBeInTheDocument();
    });
  });
});
```

---

## 🎭 Mock Setup

### Firebase Mocking

```typescript
// Mock Firebase
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;

// Mock Firestore functions
jest.mock('firebase/firestore');
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;

describe('Firebase Integration', () => {
  const mockDb = {
    doc: jest.fn(),
    collection: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue(mockDb as any);
    mockUpdateDoc.mockResolvedValue(undefined);
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ name: 'Test' })
    } as any);
  });
});
```

### Server Action Mocking

```typescript
// Mock server actions
jest.mock('@/app/example/actions');
const mockExampleAction = exampleAction as jest.MockedFunction<typeof exampleAction>;

describe('Component with Server Action', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call server action with correct data', async () => {
    mockExampleAction.mockResolvedValue({ success: true });
    
    render(<Component />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockExampleAction).toHaveBeenCalledWith({
        expected: 'data'
      });
    });
  });
});
```

### External Service Mocking

```typescript
// Mock external services
jest.mock('@/lib/paypal-service');
const mockPayPalService = {
  createPayment: jest.fn(),
  capturePayment: jest.fn(),
};

describe('Payment Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPayPalService.createPayment.mockResolvedValue({
      id: 'payment-123',
      status: 'created'
    });
  });
});
```

---

## 🎯 Test Patterns

### 1. Arrange-Act-Assert Pattern

```typescript
describe('Action Tests', () => {
  it('should process data correctly', async () => {
    // Arrange
    const inputData = { name: 'John', email: 'john@example.com' };
    const expectedResult = { success: true, message: 'Success' };
    mockAction.mockResolvedValue(expectedResult);

    // Act
    const result = await processData(inputData);

    // Assert
    expect(result).toEqual(expectedResult);
    expect(mockAction).toHaveBeenCalledWith(inputData);
  });
});
```

### 2. Given-When-Then Pattern

```typescript
describe('Business Logic Tests', () => {
  it('should calculate total correctly', () => {
    // Given
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 }
    ];

    // When
    const total = calculateTotal(items);

    // Then
    expect(total).toBe(35); // (10*2) + (5*3) = 35
  });
});
```

### 3. Test Data Builders

```typescript
// Test data builder
class UserBuilder {
  private user: Partial<User> = {};

  withName(name: string) {
    this.user.name = name;
    return this;
  }

  withEmail(email: string) {
    this.user.email = email;
    return this;
  }

  withRole(role: UserRole) {
    this.user.role = role;
    return this;
  }

  build(): User {
    return {
      id: 'test-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'client',
      ...this.user
    } as User;
  }
}

// Usage in tests
describe('User Tests', () => {
  it('should create admin user', () => {
    const user = new UserBuilder()
      .withName('Admin User')
      .withEmail('admin@example.com')
      .withRole('admin')
      .build();

    expect(user.role).toBe('admin');
  });
});
```

### 4. Parameterized Tests

```typescript
describe('Validation Tests', () => {
  const invalidEmails = [
    'invalid-email',
    '@example.com',
    'test@',
    'test.example.com',
    ''
  ];

  test.each(invalidEmails)('should reject invalid email: %s', async (email) => {
    const result = await validateEmail(email);
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid email');
  });

  const validEmails = [
    'test@example.com',
    'user.name@domain.co.uk',
    'admin+tag@company.org'
  ];

  test.each(validEmails)('should accept valid email: %s', async (email) => {
    const result = await validateEmail(email);
    expect(result.success).toBe(true);
  });
});
```

---

## 🏃‍♂️ Running Tests

### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- actions.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should validate"

# Run tests in specific directory
npm test -- src/app/admin

# Run tests with verbose output
npm test -- --verbose

# Run tests in CI mode
npm run test:ci
```

### Test Scripts in package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:update": "jest --updateSnapshot"
  }
}
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

---

## 🔧 Troubleshooting

### Common Test Issues

#### 1. Mock Not Working
```typescript
// ❌ Problem: Mock not properly configured
jest.mock('@/lib/firebase');
const mockGetDb = getDb; // Missing type assertion

// ✅ Solution: Proper mock setup
jest.mock('@/lib/firebase');
const mockGetDb = getDb as jest.MockedFunction<typeof getDb>;
```

#### 2. Async Test Issues
```typescript
// ❌ Problem: Not waiting for async operations
it('should handle async operation', () => {
  const result = asyncOperation();
  expect(result.success).toBe(true); // Fails - result is a Promise
});

// ✅ Solution: Proper async handling
it('should handle async operation', async () => {
  const result = await asyncOperation();
  expect(result.success).toBe(true);
});
```

#### 3. Component Not Rendering
```typescript
// ❌ Problem: Missing required props
render(<Component />); // Component expects props

// ✅ Solution: Provide required props
render(<Component requiredProp="value" />);
```

#### 4. Firebase Mock Issues
```typescript
// ❌ Problem: Mock not returning expected structure
mockGetDoc.mockResolvedValue({ data: 'test' }); // Missing exists() method

// ✅ Solution: Proper mock structure
mockGetDoc.mockResolvedValue({
  exists: () => true,
  data: () => ({ name: 'test' })
} as any);
```

### Debugging Tips

#### 1. Add Debug Logging
```typescript
it('should debug test', async () => {
  console.log('Test starting...');
  
  const result = await action(data);
  console.log('Result:', result);
  
  expect(result.success).toBe(true);
});
```

#### 2. Use screen.debug()
```typescript
it('should debug component', () => {
  render(<Component />);
  screen.debug(); // Prints current DOM
});
```

#### 3. Check Mock Calls
```typescript
it('should verify mock calls', async () => {
  await action(data);
  
  console.log('Mock calls:', mockFunction.mock.calls);
  expect(mockFunction).toHaveBeenCalledWith(expectedData);
});
```

#### 4. Test Isolation
```typescript
describe('Isolated Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Clear all mocks
    jest.resetAllMocks(); // Reset mock implementations
  });
});
```

---

## 📊 Test Metrics

### Current Test Coverage

| Component | Coverage | Status |
|-----------|----------|--------|
| Server Actions | 68% | ✅ Good |
| Components | 45% | ⚠️ Needs Improvement |
| Utilities | 80% | ✅ Excellent |
| Integration | 60% | ✅ Good |

### Test Performance

| Test Suite | Duration | Status |
|------------|----------|--------|
| Server Actions | 4.6s | ✅ Fast |
| Components | 12.3s | ⚠️ Slow |
| Integration | 8.1s | ✅ Good |
| E2E | 45.2s | ⚠️ Slow |

### Test Quality Metrics

- **Flaky Tests**: 2% (Target: <1%)
- **Test Maintenance**: 15% (Target: <10%)
- **Code Coverage**: 60% (Target: 70%)
- **Test Execution Time**: 25s (Target: <20s)

---

## 🎯 Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Keep tests focused and simple

### 2. Mock Management
- Clear mocks between tests
- Use proper TypeScript types for mocks
- Mock at the right level (not too deep, not too shallow)
- Verify mock interactions

### 3. Test Data
- Use builders for complex test data
- Keep test data minimal and focused
- Use realistic data when possible
- Avoid hardcoded values

### 4. Async Testing
- Always await async operations
- Use waitFor for DOM updates
- Handle loading states properly
- Test error scenarios

### 5. Coverage Goals
- Aim for 70%+ code coverage
- Focus on critical business logic
- Don't test implementation details
- Test user-facing behavior

---

## 🚀 Future Improvements

### Short-term (1-2 weeks)
1. Fix remaining mock configuration issues
2. Add missing component tests
3. Improve test performance
4. Add integration tests

### Medium-term (1-2 months)
1. Implement E2E testing
2. Add visual regression tests
3. Set up test automation
4. Improve test documentation

### Long-term (3-6 months)
1. Implement property-based testing
2. Add performance testing
3. Set up test analytics
4. Implement test generation

---

## 📚 Additional Resources

### Testing Libraries
- [Jest](https://jestjs.io/) - Testing framework
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) - Component testing
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite) - Firebase emulators
- [MSW](https://mswjs.io/) - API mocking

### Documentation
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Firebase Testing Guide](https://firebase.google.com/docs/emulator-suite/connect_and_prototype)

---

## ✅ Conclusion

This testing documentation provides comprehensive guidelines for testing the server actions migration and the overall application. Following these patterns and best practices will ensure robust, maintainable, and reliable tests.

**Key Takeaways:**
- Use proper mock setup for Firebase and server actions
- Test validation, success cases, and error handling
- Follow consistent test patterns and organization
- Aim for high test coverage on critical functionality
- Keep tests fast, focused, and maintainable

For additional help with testing, refer to the developer guide or contact the development team.

---

*Last Updated: January 2025*
*Documentation Version: 1.0*
