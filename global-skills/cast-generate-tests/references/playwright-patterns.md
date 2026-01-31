# Playwright Test Patterns

## Core Test Patterns

### Page Object Model (POM)
Organize test code by creating page objects that encapsulate page elements and actions:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.page.fill('[data-testid="email"]', email);
    await this.page.fill('[data-testid="password"]', password);
    await this.page.click('[data-testid="login-button"]');
  }

  async getErrorMessage() {
    return await this.page.textContent('[data-testid="error-message"]');
  }
}

// tests/auth.spec.ts
import { LoginPage } from '../pages/LoginPage';

test('user can log in with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.navigate();
  await loginPage.login('user@example.com', 'password123');
  
  await expect(page).toHaveURL('/dashboard');
});
```

### Test Data Factory Pattern
Create reusable test data generators:

```typescript
// fixtures/userFactory.ts
export class UserFactory {
  static createValidUser() {
    return {
      email: `user${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      firstName: 'John',
      lastName: 'Doe'
    };
  }

  static createInvalidUser() {
    return {
      email: 'invalid-email',
      password: '123',
      firstName: '',
      lastName: ''
    };
  }
}

// Usage in tests
test('registration with valid data', async ({ page }) => {
  const user = UserFactory.createValidUser();
  // Use user data in test
});
```

### API Testing Patterns
Test API endpoints alongside UI interactions:

```typescript
test.describe('User Management API', () => {
  test('should create user via API', async ({ request }) => {
    const userData = UserFactory.createValidUser();
    
    const response = await request.post('/api/users', {
      data: userData
    });
    
    expect(response.status()).toBe(201);
    
    const createdUser = await response.json();
    expect(createdUser).toMatchObject({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName
    });
    expect(createdUser).toHaveProperty('id');
  });

  test('should validate required fields', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: { email: 'test@example.com' } // Missing required fields
    });
    
    expect(response.status()).toBe(400);
    
    const error = await response.json();
    expect(error.message).toContain('firstName is required');
  });
});
```

## User Workflow Testing

### Complete User Journey
Test entire user workflows from start to finish:

```typescript
test('complete purchase workflow', async ({ page }) => {
  // Setup - Login user
  const user = UserFactory.createValidUser();
  await createUserViaAPI(user);
  await loginUser(page, user);

  // Navigate to product
  await page.goto('/products/1');
  await expect(page.locator('h1')).toContainText('Product Name');

  // Add to cart
  await page.click('[data-testid="add-to-cart"]');
  await expect(page.locator('[data-testid="cart-count"]')).toHaveText('1');

  // Proceed to checkout
  await page.click('[data-testid="checkout-button"]');
  await expect(page).toHaveURL(/\/checkout/);

  // Fill shipping information
  await fillShippingForm(page, {
    address: '123 Main St',
    city: 'New York',
    zip: '10001'
  });

  // Complete payment
  await fillPaymentForm(page, {
    cardNumber: '4242424242424242',
    expiryMonth: '12',
    expiryYear: '2025',
    cvc: '123'
  });

  // Submit order
  await page.click('[data-testid="place-order"]');
  
  // Verify success
  await expect(page.locator('[data-testid="order-success"]'))
    .toContainText('Order placed successfully');
    
  // Verify order in database
  const order = await getOrderFromAPI(user.id);
  expect(order.status).toBe('pending');
});
```

### Multi-step Form Testing
Handle complex forms with validation:

```typescript
test('multi-step form completion', async ({ page }) => {
  await page.goto('/onboarding');

  // Step 1: Personal Information
  await page.fill('[data-testid="first-name"]', 'John');
  await page.fill('[data-testid="last-name"]', 'Doe');
  await page.click('[data-testid="next-step"]');

  // Verify progress indicator
  await expect(page.locator('[data-testid="progress"]')).toHaveAttribute('data-step', '2');

  // Step 2: Company Information
  await page.fill('[data-testid="company-name"]', 'Acme Corp');
  await page.selectOption('[data-testid="company-size"]', '10-50');
  await page.click('[data-testid="next-step"]');

  // Step 3: Preferences
  await page.check('[data-testid="newsletter"]');
  await page.selectOption('[data-testid="timezone"]', 'America/New_York');
  await page.click('[data-testid="complete"]');

  // Verify completion
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="welcome-message"]'))
    .toContainText('Welcome, John!');
});
```

## Error Handling Patterns

### Network Error Simulation
Test how the application handles network failures:

```typescript
test('handles network errors gracefully', async ({ page }) => {
  // Simulate network failure
  await page.route('/api/users', route => {
    route.abort('failed');
  });

  await page.goto('/users');

  // Verify error message is displayed
  await expect(page.locator('[data-testid="error-message"]'))
    .toContainText('Failed to load users');

  // Verify retry mechanism
  await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
});

test('recovers from network errors', async ({ page }) => {
  let failCount = 0;
  
  await page.route('/api/users', route => {
    if (failCount < 2) {
      failCount++;
      route.abort('failed');
    } else {
      route.fulfill({
        status: 200,
        body: JSON.stringify([{ id: 1, name: 'John Doe' }])
      });
    }
  });

  await page.goto('/users');
  
  // First attempt should fail
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  
  // Retry should succeed
  await page.click('[data-testid="retry-button"]');
  await expect(page.locator('[data-testid="user-1"]')).toContainText('John Doe');
});
```

### Validation Error Testing
Test form validation and error display:

```typescript
test('displays validation errors', async ({ page }) => {
  await page.goto('/register');

  // Submit empty form
  await page.click('[data-testid="submit"]');

  // Check for validation errors
  await expect(page.locator('[data-testid="email-error"]'))
    .toContainText('Email is required');
  await expect(page.locator('[data-testid="password-error"]'))
    .toContainText('Password is required');

  // Verify form doesn't submit
  await expect(page).toHaveURL('/register');
});

test('clears errors when fields are corrected', async ({ page }) => {
  await page.goto('/register');
  
  // Trigger validation error
  await page.click('[data-testid="submit"]');
  await expect(page.locator('[data-testid="email-error"]')).toBeVisible();

  // Fill field correctly
  await page.fill('[data-testid="email"]', 'user@example.com');
  
  // Verify error is cleared
  await expect(page.locator('[data-testid="email-error"]')).not.toBeVisible();
});
```

## Performance Testing Patterns

### Core Web Vitals Monitoring
Monitor key performance metrics:

```typescript
test('meets Core Web Vitals benchmarks', async ({ page }) => {
  await page.goto('/');

  // Measure Largest Contentful Paint (LCP)
  const lcp = await page.evaluate(() => {
    return new Promise((resolve) => {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
  });

  expect(lcp).toBeLessThan(2500); // 2.5 seconds

  // Measure Cumulative Layout Shift (CLS)
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        resolve(clsValue);
      }).observe({ type: 'layout-shift', buffered: true });
      
      setTimeout(() => resolve(clsValue), 1000);
    });
  });

  expect(cls).toBeLessThan(0.1); // Maximum acceptable CLS
});
```

### Resource Loading Testing
Monitor resource loading performance:

```typescript
test('loads resources efficiently', async ({ page }) => {
  const responses = [];
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      size: response.headers()['content-length'] || 0
    });
  });

  await page.goto('/');

  // Check that critical resources load quickly
  const criticalResources = responses.filter(r => 
    r.url.includes('.css') || r.url.includes('.js')
  );

  expect(criticalResources.length).toBeGreaterThan(0);
  
  // Verify no failed requests
  const failedRequests = responses.filter(r => r.status >= 400);
  expect(failedRequests).toHaveLength(0);
});
```

## Accessibility Testing Patterns

### Basic Accessibility Checks
Ensure basic accessibility compliance:

```typescript
test('meets accessibility standards', async ({ page }) => {
  await page.goto('/');

  // Check for proper heading structure
  const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
  expect(headings.length).toBeGreaterThan(0);

  // Verify main content has proper landmarks
  await expect(page.locator('main')).toBeVisible();
  await expect(page.locator('nav')).toBeVisible();

  // Check for alt text on images
  const images = await page.locator('img').all();
  for (const img of images) {
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
  }

  // Verify form labels
  const inputs = await page.locator('input[type="text"], input[type="email"]').all();
  for (const input of inputs) {
    const id = await input.getAttribute('id');
    if (id) {
      await expect(page.locator(`label[for="${id}"]`)).toBeVisible();
    }
  }
});
```

### Keyboard Navigation Testing
Test keyboard accessibility:

```typescript
test('supports keyboard navigation', async ({ page }) => {
  await page.goto('/');

  // Test tab order
  await page.keyboard.press('Tab');
  const firstFocused = await page.locator(':focus');
  expect(await firstFocused.isVisible()).toBeTruthy();

  // Test skip link
  await page.keyboard.press('Enter');
  const mainContent = await page.locator('#main-content');
  await expect(mainContent).toBeFocused();

  // Test menu navigation with arrow keys
  await page.focus('[data-testid="main-menu"]');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-testid="first-menu-item"]')).toBeFocused();
});
```

## Mobile Testing Patterns

### Responsive Design Testing
Test across different screen sizes:

```typescript
test.describe('Mobile Responsiveness', () => {
  const devices = [
    { name: 'iPhone 13', width: 390, height: 844 },
    { name: 'iPad', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  for (const device of devices) {
    test(`displays correctly on ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto('/');

      // Verify navigation is accessible
      if (device.width < 768) {
        // Mobile: hamburger menu
        await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
        await expect(page.locator('[data-testid="desktop-nav"]')).not.toBeVisible();
      } else {
        // Desktop: full navigation
        await expect(page.locator('[data-testid="desktop-nav"]')).toBeVisible();
        await expect(page.locator('[data-testid="mobile-menu-button"]')).not.toBeVisible();
      }

      // Verify content is readable
      const heading = page.locator('h1');
      await expect(heading).toBeVisible();
      
      // Take screenshot for visual regression
      await page.screenshot({ 
        path: `screenshots/${device.name.toLowerCase()}.png`,
        fullPage: true
      });
    });
  }
});
```

### Touch Interaction Testing
Test mobile-specific interactions:

```typescript
test('supports touch gestures', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto('/gallery');

  // Test swipe gesture
  const gallery = page.locator('[data-testid="image-gallery"]');
  await gallery.hover();
  
  await page.mouse.down();
  await page.mouse.move(100, 0); // Swipe right
  await page.mouse.up();

  // Verify image changed
  await expect(page.locator('[data-testid="active-image"]'))
    .toHaveAttribute('data-index', '1');

  // Test pinch zoom (if supported)
  await page.touchscreen.tap(200, 300);
  // Verify zoom functionality
});
```