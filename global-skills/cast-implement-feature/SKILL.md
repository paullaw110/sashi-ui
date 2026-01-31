---
name: cast-implement-feature
description: Orchestrate parallel backend and frontend development for feature implementation. Use this skill when users request "CAST IMPLEMENT_FEATURE" or need coordinated full-stack development with API creation, frontend integration, database schema, and real-time collaboration between development layers.
---

# CAST: IMPLEMENT_FEATURE

Coordinate parallel backend and frontend development to implement complete features efficiently with proper integration and testing throughout the development process.

## What This Creates

A comprehensive feature implementation including:
- Backend API endpoints and business logic
- Frontend components and user interfaces
- Database schema and data management
- Integration between frontend and backend
- Real-time development coordination
- Continuous integration and testing

## Usage Patterns

**Direct command:**
```
CAST: IMPLEMENT_FEATURE
```

**With coordination strategy:**
```
CAST: IMPLEMENT_FEATURE --strategy parallel
CAST: IMPLEMENT_FEATURE --strategy sequential
CAST: IMPLEMENT_FEATURE --focus backend
```

## Development Orchestration

### 1. Development Strategy Planning
- Analyze PRD and task breakdown
- Identify frontend-backend integration points
- Plan parallel development workflow
- Set up communication protocols

### 2. Parallel Development Coordination
- Spawn specialized coding agents
- Backend API development track
- Frontend implementation track
- Database and infrastructure track
- Continuous integration and testing

### 3. Integration Management
- API contract verification
- Frontend-backend integration testing
- Data flow validation
- User experience validation

## Development Tracks

### Backend Development Track
- **API Design:** RESTful endpoints, GraphQL schemas
- **Business Logic:** Core feature functionality
- **Data Management:** Database operations, caching
- **Authentication:** Security and authorization
- **Testing:** Unit tests, integration tests

### Frontend Development Track
- **Component Development:** React components, UI elements
- **State Management:** Redux, Context API, state logic
- **API Integration:** Fetch data, handle responses
- **User Experience:** Interactions, animations, accessibility
- **Testing:** Component tests, E2E tests

### Integration Track
- **API Contracts:** OpenAPI specifications
- **Data Flow:** Request/response validation
- **Error Handling:** Graceful error management
- **Performance:** Optimization and monitoring
- **Documentation:** API docs, component guides

## Coordination Strategies

### Parallel Development
```
Backend Agent ←→ Integration Manager ←→ Frontend Agent
     ↓                    ↓                    ↓
   API Dev          Contract Sync         UI Dev
   Testing         Integration Tests      Testing
   Deploy             Monitoring         Deploy
```

### Contract-First Development
1. **API Contract Definition:** Define endpoints and schemas
2. **Mock Implementation:** Create API mocks for frontend
3. **Parallel Implementation:** Develop both sides simultaneously
4. **Integration Testing:** Validate real API integration
5. **Deployment Coordination:** Deploy frontend and backend together

### Feature Flag Coordination
- Progressive feature rollout
- A/B testing implementation
- Safe deployment practices
- Rollback capabilities

## Available Scripts

### Development Orchestrator
`scripts/orchestrate_development.py` - Coordinate parallel development

### Agent Spawner
`scripts/spawn_agents.py` - Create specialized coding agents

### Integration Manager
`scripts/integration_manager.py` - Monitor and coordinate integration

## Code Generation Patterns

### Backend Code Generation
- Express.js/Node.js API endpoints
- TypeScript interfaces and types
- Database models and migrations
- Authentication middleware
- Testing frameworks (Jest, Supertest)

### Frontend Code Generation
- React components with TypeScript
- State management setup
- API service layers
- Responsive design implementation
- Testing utilities (React Testing Library)

### Integration Code Generation
- API client generation
- Type-safe API calls
- Error boundary components
- Loading states and feedback
- Performance monitoring

## Quality Assurance

### Continuous Integration
- Automated testing on every commit
- Code quality checks and linting
- Security vulnerability scanning
- Performance monitoring
- Integration testing between layers

### Development Standards
- Code review requirements
- Testing coverage thresholds
- Documentation standards
- Performance benchmarks
- Security compliance

## Reference Materials

For detailed implementation patterns, see:
- [Backend development guide](references/backend-patterns.md)
- [Frontend development guide](references/frontend-patterns.md)
- [Integration strategies](references/integration-patterns.md)

## Real-time Collaboration

### Development Synchronization
- Shared development state tracking
- Real-time progress updates
- Conflict resolution strategies
- Communication protocols

### Issue Resolution
- Cross-team issue tracking
- Dependency blocker management
- Integration problem solving
- Performance optimization coordination

## Quality Standards

Every feature implementation must include:
- ✅ Working backend API endpoints
- ✅ Responsive frontend interface
- ✅ Proper error handling
- ✅ Comprehensive test coverage
- ✅ Performance optimization
- ✅ Security implementation
- ✅ Documentation and guides