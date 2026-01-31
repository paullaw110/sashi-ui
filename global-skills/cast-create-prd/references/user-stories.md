# User Story Writing Guide

## Story Format

### Standard Template
```
As a [user type/persona]
I want [functionality/feature]
So that [benefit/business value]
```

### Enhanced Template (for complex stories)
```
As a [user type]
I want to [action/goal]
So that [benefit]
Given [context/preconditions]
```

## Story Quality Criteria

### INVEST Principles
- **Independent:** Can be developed independently
- **Negotiable:** Details can be discussed and refined
- **Valuable:** Provides clear value to users or business
- **Estimable:** Development effort can be estimated
- **Small:** Can be completed in one sprint
- **Testable:** Has clear acceptance criteria

## Writing Effective Acceptance Criteria

### Format: Given-When-Then
```
Given [context/precondition]
When [action/event]
Then [expected outcome]
```

### Format: Scenario-based
```
Scenario: [Description of scenario]
Given [context]
When [action]
Then [outcome]
And [additional outcome]
```

## Story Examples by Category

### Authentication Stories
```
As a new user
I want to create an account with email and password
So that I can access personalized features

Acceptance Criteria:
✅ Given I'm on the signup page, when I enter valid email and password, then my account is created
✅ Given I enter an existing email, when I try to signup, then I see "Email already registered" error
✅ Given I enter weak password, when I submit, then I see password requirements
✅ After successful signup, when I check my email, then I receive a verification email
```

### Data Management Stories
```
As a logged-in user
I want to import data from a CSV file
So that I can quickly populate my account with existing data

Acceptance Criteria:
✅ Given I'm on the import page, when I upload a valid CSV file, then the data is parsed and previewed
✅ Given invalid CSV format, when I upload, then I see specific format error messages
✅ Given large CSV file (>10MB), when I upload, then I see progress indicator
✅ After import completion, when I navigate to data view, then imported records are visible
```

### API Integration Stories
```
As a developer
I want to access user data via REST API
So that I can build integrations with external systems

Acceptance Criteria:
✅ Given valid API key, when I make GET request to /api/users, then I receive user data as JSON
✅ Given invalid API key, when I make request, then I receive 401 Unauthorized
✅ Given rate limit exceeded, when I make request, then I receive 429 Too Many Requests
✅ All API responses include proper CORS headers for browser access
```

## Story Categories

### Feature Stories
Focus on new functionality that delivers direct user value.

### Technical Stories
Address technical debt, infrastructure, or developer experience improvements.

### Bug Stories
Fix existing functionality that's not working as expected.

### Spike Stories
Research or investigation work with time-boxed effort.

## Persona-Driven Stories

### Admin User Stories
```
As an admin user
I want to manage user permissions
So that I can control access to sensitive features
```

### End User Stories
```
As an end user
I want to customize my dashboard
So that I can see the most relevant information first
```

### API Consumer Stories
```
As a third-party developer
I want comprehensive API documentation
So that I can integrate quickly without support requests
```

## Story Sizing Guidelines

### Small (1-3 story points)
- Simple CRUD operations
- Basic UI components
- Configuration changes

### Medium (5-8 story points)
- Complex forms with validation
- API integrations
- Multi-step workflows

### Large (13+ story points)
- New major features
- Complex algorithms
- Multiple system integrations

*Note: Large stories should be broken down into smaller stories*

## Common Anti-patterns

### ❌ Avoid These
```
// Too technical
As a developer, I want to refactor the authentication service

// Too vague
As a user, I want the system to be fast

// Missing business value
As a user, I want a dropdown menu
```

### ✅ Better Alternatives
```
// Business-focused
As a user, I want to stay logged in for 30 days so that I don't have to re-enter credentials frequently

// Specific and measurable
As a user, I want pages to load in under 2 seconds so that I can work efficiently

// Value-driven
As a user, I want to filter results by category so that I can find relevant items quickly
```