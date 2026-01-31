# Task Decomposition Guide

## Decomposition Principles

### Feature-First Approach
Break down by user-facing features before technical layers:
1. **User Story → Feature Tasks**
2. **Feature Tasks → Technical Implementation**
3. **Technical Implementation → Specific Development Tasks**

### Layer-Based Breakdown
For each feature, create tasks across layers:
- **UI Layer:** Components, pages, styling, interactions
- **API Layer:** Endpoints, validation, business logic
- **Data Layer:** Schema, queries, migrations
- **Integration Layer:** External services, webhooks

## Task Sizing Guidelines

### Story Point Scale (Modified Fibonacci)
- **1 Point:** Simple configuration, minor UI updates
- **2 Points:** Basic CRUD operations, simple components
- **3 Points:** Complex forms, API integrations
- **5 Points:** New feature implementation, complex business logic
- **8 Points:** Major architectural changes, complex integrations
- **13 Points:** Epic-level work (should be broken down further)

### Size Indicators
```
1-2 Points: Half day to 1 day
3 Points: 1-2 days
5 Points: 3-4 days
8 Points: 1 week
13+ Points: Should be decomposed
```

## Decomposition Patterns

### Authentication Feature Example
```
Epic: User Authentication System

Story: As a user, I want to log in with email/password

Tasks:
├── Frontend (8 points total)
│   ├── Login form component (2 points)
│   ├── Authentication state management (3 points)
│   ├── Protected route wrapper (2 points)
│   └── Logout functionality (1 point)
├── Backend (13 points total)
│   ├── User model and database schema (3 points)
│   ├── Authentication endpoints (5 points)
│   ├── JWT token management (3 points)
│   └── Password hashing and validation (2 points)
├── Testing (5 points total)
│   ├── Unit tests for auth logic (2 points)
│   ├── Integration tests for API (2 points)
│   └── E2E login/logout tests (1 point)
└── DevOps (3 points total)
    ├── Environment variables setup (1 point)
    └── Session management configuration (2 points)
```

### Data Management Feature Example
```
Epic: Data Import System

Story: As a user, I want to import CSV data

Tasks:
├── Backend Processing (21 points total)
│   ├── File upload endpoint (3 points)
│   ├── CSV parsing service (5 points)
│   ├── Data validation logic (5 points)
│   ├── Batch insert operations (5 points)
│   └── Import progress tracking (3 points)
├── Frontend Interface (13 points total)
│   ├── File upload component (3 points)
│   ├── Progress indicator UI (2 points)
│   ├── Data preview table (5 points)
│   └── Error handling and display (3 points)
├── Background Processing (8 points total)
│   ├── Queue system integration (5 points)
│   └── Import job management (3 points)
└── Testing & Validation (8 points total)
    ├── Unit tests for parsing (2 points)
    ├── Integration tests for upload (3 points)
    └── Performance tests with large files (3 points)
```

## Task Dependencies

### Dependency Types
1. **Hard Dependencies:** Must complete before starting
2. **Soft Dependencies:** Beneficial to complete first
3. **Parallel Work:** Can be done simultaneously
4. **Integration Dependencies:** Require coordination

### Dependency Mapping
```
Task A (Database Schema) → Task B (API Endpoints) → Task C (Frontend Integration)
         │                           │
         └── Task D (Data Migration)  └── Task E (Unit Tests)
```

### Critical Path Identification
- Identify the longest sequence of dependent tasks
- Flag tasks that could delay the entire project
- Suggest parallel work opportunities

## Task Categories

### By Development Type
- **Feature Development:** New user-facing functionality
- **Technical Debt:** Code quality improvements
- **Bug Fixes:** Correcting existing functionality
- **Infrastructure:** DevOps, deployment, monitoring
- **Research/Spike:** Investigation with time-boxed effort

### By Skill Requirement
- **Frontend Specialist:** React, CSS, UX implementation
- **Backend Specialist:** APIs, business logic, databases
- **Full-Stack:** Can work across layers
- **DevOps Engineer:** Infrastructure, deployment, CI/CD
- **QA Engineer:** Testing, quality assurance

## Task Templates

### Feature Development Task
```
Title: Implement [specific functionality]
Description: Detailed description of what needs to be built
Acceptance Criteria:
- [ ] Specific, testable requirement
- [ ] Another testable requirement
- [ ] Error handling requirement
Story Points: [1-13]
Dependencies: [List of prerequisite tasks]
Labels: frontend|backend|database, priority/high|medium|low
Definition of Done:
- [ ] Code implemented and tested
- [ ] Code review completed
- [ ] Documentation updated
```

### Bug Fix Task
```
Title: Fix [specific issue]
Description: Current behavior vs expected behavior
Steps to Reproduce: [Clear reproduction steps]
Acceptance Criteria:
- [ ] Issue is resolved
- [ ] Regression test added
- [ ] No new issues introduced
Story Points: [Typically 1-3]
Priority: P0|P1|P2|P3
```

### Technical Debt Task
```
Title: Refactor [component/module]
Description: Technical improvement rationale
Current State: Description of current implementation
Desired State: Description of improved implementation
Acceptance Criteria:
- [ ] Code quality improved
- [ ] Performance metrics met
- [ ] No functional changes
Story Points: [Varies widely]
Impact: high|medium|low
```

## Quality Checklist

### Task Definition Quality
- [ ] Title is clear and action-oriented
- [ ] Description provides sufficient context
- [ ] Acceptance criteria are specific and testable
- [ ] Story points reflect realistic effort
- [ ] Dependencies are clearly identified
- [ ] Appropriate labels are assigned

### Decomposition Quality
- [ ] No task exceeds 8 story points
- [ ] Related tasks are grouped logically
- [ ] Dependencies form a clear workflow
- [ ] Parallel work opportunities identified
- [ ] Critical path is optimized

### Planning Quality
- [ ] Sprint capacity considered
- [ ] Team skills aligned with task requirements
- [ ] Risk factors identified and mitigated
- [ ] Integration points clearly defined