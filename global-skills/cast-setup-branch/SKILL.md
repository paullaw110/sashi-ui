---
name: cast-setup-branch
description: Initialize feature branches with proper Git structure, project setup, and development environment configuration. Use this skill when users request "CAST SETUP_BRANCH [feature-name]" or need to create properly structured development branches with boilerplate code, CI/CD configuration, and project organization.
---

# CAST: SETUP_BRANCH

Initialize feature development branches with comprehensive project structure, boilerplate code, and development environment setup.

## What This Creates

A fully configured feature branch including:
- Git branch with proper naming conventions
- Project directory structure
- Boilerplate code templates
- CI/CD configuration files
- Development environment setup
- Initial test structure
- Documentation templates

## Usage Patterns

**Direct command:**
```
CAST: SETUP_BRANCH feature-name
```

**With options:**
```
CAST: SETUP_BRANCH user-authentication --type fullstack
CAST: SETUP_BRANCH dashboard-ui --type frontend
CAST: SETUP_BRANCH payment-api --type backend
```

## Branch Setup Process

### 1. Git Branch Management
- Create feature branch from main/develop
- Apply consistent naming conventions
- Set up branch protection and workflows
- Configure upstream tracking

### 2. Project Structure Creation
- Frontend directory structure
- Backend API organization
- Database migration folders
- Test directory hierarchy
- Documentation templates

### 3. Boilerplate Generation
- Code templates for common patterns
- Configuration files
- Environment setup scripts
- Initial test files

### 4. CI/CD Configuration
- GitHub Actions workflows
- Build and test pipelines
- Deployment configurations
- Quality gates and checks

## Branch Naming Conventions

### Standard Format
```
feature/[issue-number]-[brief-description]
bugfix/[issue-number]-[brief-description]
hotfix/[issue-number]-[brief-description]
```

### Examples
```
feature/123-user-authentication
feature/456-payment-processing
bugfix/789-login-error
hotfix/101-security-patch
```

## Project Structure Templates

### Full-Stack Project
```
feature/user-authentication/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── middleware/
│   ├── tests/
│   └── package.json
├── database/
│   ├── migrations/
│   ├── seeds/
│   └── schema/
├── docs/
│   ├── api.md
│   └── features.md
└── .github/
    └── workflows/
```

### Frontend-Only Project
```
feature/dashboard-ui/
├── src/
│   ├── components/
│   ├── pages/
│   ├── hooks/
│   ├── services/
│   └── styles/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── docs/
└── .github/workflows/
```

### Backend-Only Project
```
feature/payment-api/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── routes/
│   └── middleware/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── api/
├── database/
│   ├── migrations/
│   └── seeds/
├── docs/
│   └── api/
└── .github/workflows/
```

## Available Scripts

### Branch Creator
`scripts/create_branch.py` - Automated branch creation with structure setup

### Project Initializer  
`scripts/init_project.py` - Generate project boilerplate based on type

### CI/CD Generator
`scripts/setup_cicd.py` - Create workflow files and configurations

## Integration with Development Workflow

### Pre-development Checklist
- [ ] Branch created from latest main/develop
- [ ] Project structure initialized
- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Initial tests passing
- [ ] CI/CD workflows validated

### Post-setup Validation
- [ ] Branch builds successfully
- [ ] Tests run and pass
- [ ] Linting and formatting rules applied
- [ ] Development server starts correctly
- [ ] Documentation generated

## Quality Standards

Every feature branch must include:
- ✅ Consistent naming convention
- ✅ Proper project structure
- ✅ Working CI/CD pipeline
- ✅ Initial test coverage
- ✅ Development environment setup
- ✅ Clear documentation structure