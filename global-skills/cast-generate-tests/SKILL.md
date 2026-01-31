---
name: cast-generate-tests
description: Generate comprehensive Playwright end-to-end tests from PRD acceptance criteria and user stories. Use this skill when users request "CAST GENERATE_TESTS" or need to create automated test suites, test scenarios, API tests, or quality assurance validation from product requirements.
---

# CAST: GENERATE_TESTS

Generate comprehensive test suites from Product Requirements Documents, converting acceptance criteria into automated Playwright tests and quality validation scenarios.

## What This Creates

A complete testing framework including:
- End-to-end Playwright tests from acceptance criteria
- API integration tests
- Visual regression tests
- Performance testing scenarios
- Cross-browser compatibility tests
- Mobile responsive tests
- Accessibility compliance tests

## Usage Patterns

**Direct command:**
```
CAST: GENERATE_TESTS
```

**With specific scope:**
```
CAST: GENERATE_TESTS --type e2e
CAST: GENERATE_TESTS --type api
CAST: GENERATE_TESTS --feature user-authentication
```

## Test Generation Process

### 1. PRD Analysis
- Parse acceptance criteria from user stories
- Extract testable requirements
- Identify user workflows and edge cases
- Map business rules to test scenarios

### 2. Test Suite Creation
- Generate Playwright test files
- Create test data and fixtures
- Set up page object models
- Configure test environments

### 3. Quality Validation
- Performance benchmarks
- Accessibility standards (WCAG)
- Cross-browser compatibility
- Mobile responsiveness
- Security testing scenarios

## Test Categories

### End-to-End Tests
- **User Workflows:** Complete user journeys from start to finish
- **Feature Integration:** How features work together
- **Error Scenarios:** Error handling and edge cases
- **Data Persistence:** Data creation, modification, deletion

### API Tests
- **Endpoint Validation:** Request/response verification
- **Authentication:** Login, logout, token management
- **Data Validation:** Input validation and sanitization
- **Error Handling:** HTTP status codes and error messages

### Visual Tests
- **Component Rendering:** UI component appearance
- **Responsive Design:** Layout across screen sizes
- **Cross-browser:** Consistency across browsers
- **Theme Variations:** Light/dark mode, branding

### Performance Tests
- **Page Load Times:** Core Web Vitals compliance
- **API Response Times:** Endpoint performance
- **Resource Loading:** Images, scripts, stylesheets
- **Memory Usage:** Resource consumption monitoring

## Test Structure Templates

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup for each test
  });

  test('should handle primary user workflow', async ({ page }) => {
    // Given - Setup initial state
    // When - Perform user actions
    // Then - Verify expected outcomes
  });

  test('should handle error scenarios', async ({ page }) => {
    // Test error conditions and edge cases
  });
});
```

### API Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('GET /api/resource should return data', async ({ request }) => {
    const response = await request.get('/api/resource');
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('id');
  });
});
```

## Available Scripts

### Test Generator
`scripts/generate_playwright_tests.py` - Convert acceptance criteria to tests

### Test Runner
`scripts/run_tests.py` - Execute test suites with reporting

### Performance Validator
`scripts/performance_tests.py` - Generate performance test scenarios

## Reference Materials

For detailed test patterns and examples, see:
- [Playwright test patterns](references/playwright-patterns.md)
- [Test data management](references/test-data.md)
- [Accessibility testing](references/accessibility-tests.md)

## Integration with Development Workflow

### Test-Driven Development
- Generate tests before implementation
- Use tests to validate feature completion
- Continuous integration with GitHub Actions
- Automated test reporting and metrics

### Quality Gates
- All tests must pass before merge
- Performance benchmarks must be met
- Accessibility standards compliance
- Cross-browser compatibility verified

## Quality Standards

Every test suite must include:
- ✅ Comprehensive acceptance criteria coverage
- ✅ Error scenario validation
- ✅ Performance benchmarks
- ✅ Accessibility compliance checks
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness validation