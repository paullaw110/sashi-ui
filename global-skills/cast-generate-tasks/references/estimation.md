# Estimation Guidelines

## Story Point System

### Modified Fibonacci Scale
**1, 2, 3, 5, 8, 13, 21**

*Note: Tasks above 13 points should be decomposed into smaller tasks*

### Point Values & Time Correlation

| Points | Complexity | Time Estimate | Examples |
|--------|------------|---------------|----------|
| 1 | Trivial | 2-4 hours | Config change, minor text update |
| 2 | Simple | Half day | Basic CRUD endpoint, simple component |
| 3 | Moderate | 1-2 days | Complex form, API integration |
| 5 | Complex | 3-4 days | New feature implementation |
| 8 | Very Complex | 1 week | Major architectural change |
| 13 | Epic | 2+ weeks | Should be broken down |

## Estimation Factors

### Complexity Indicators
- **Technical Complexity:** New technologies, algorithms, integrations
- **Business Logic Complexity:** Rules, validations, edge cases
- **UI/UX Complexity:** Interactions, animations, responsive design
- **Data Complexity:** Schema changes, migrations, performance

### Risk Factors (Add +1-2 points)
- **Unknown Technology:** First time using a tool/framework
- **External Dependencies:** Third-party APIs, vendor deliverables
- **Cross-team Coordination:** Requires collaboration across teams
- **Performance Requirements:** Specific speed/scale requirements

### Effort Reduction (Subtract points)
- **Existing Patterns:** Similar work done before
- **Good Documentation:** Clear requirements and examples
- **Stable Foundation:** Well-tested infrastructure
- **Team Experience:** Strong familiarity with the domain

## Estimation by Task Type

### Frontend Development

#### 1-Point Tasks
- Update text/copy
- Add CSS styling to existing component
- Simple state changes
- Basic prop passing

#### 2-Point Tasks
- Create basic component (button, input, card)
- Simple page layout
- Basic form validation
- Minor responsive adjustments

#### 3-Point Tasks
- Complex component with multiple states
- Form with validation and submission
- API integration with error handling
- Responsive layout with breakpoints

#### 5-Point Tasks
- Interactive component with animations
- Complex state management
- Real-time data updates
- Cross-browser compatibility issues

#### 8-Point Tasks
- Complete page with multiple features
- Complex state management refactor
- Performance optimization
- Advanced interactions (drag-drop, etc.)

### Backend Development

#### 1-Point Tasks
- Environment variable configuration
- Simple database query
- Basic validation rule
- Log message addition

#### 2-Point Tasks
- Basic CRUD endpoint
- Simple business logic function
- Database index addition
- Basic error handling

#### 3-Point Tasks
- Complex endpoint with validation
- Business logic with multiple conditions
- Database migration
- Third-party service integration

#### 5-Point Tasks
- Complex algorithm implementation
- Multi-step workflow
- Performance optimization
- Security implementation

#### 8-Point Tasks
- Major service refactor
- Complex data processing
- Advanced security features
- Architectural changes

### Database Tasks

#### 1-Point Tasks
- Add simple field to existing table
- Create basic index
- Update configuration

#### 2-Point Tasks
- Create new table
- Add foreign key relationship
- Simple data migration

#### 3-Point Tasks
- Complex table relationships
- Data transformation migration
- Performance optimization

#### 5-Point Tasks
- Major schema refactor
- Complex data migration with downtime
- New database service setup

### DevOps/Infrastructure

#### 1-Point Tasks
- Environment variable update
- Simple script modification
- Documentation update

#### 2-Point Tasks
- Deploy script creation
- Monitoring alert setup
- Basic CI/CD step

#### 3-Point Tasks
- Complex deployment pipeline
- Infrastructure provisioning
- Security configuration

#### 5-Point Tasks
- New environment setup
- Major infrastructure changes
- Complex monitoring implementation

#### 8-Point Tasks
- Complete CI/CD overhaul
- Multi-region deployment
- Major security implementation

## Common Estimation Mistakes

### Under-estimation Causes
- **Ignoring edge cases** - Account for error handling, validation
- **Missing integration complexity** - Consider system interactions
- **Overlooking testing effort** - Include unit/integration/E2E tests
- **Forgetting documentation** - Code comments, API docs, user guides

### Over-estimation Causes
- **Assuming worst-case scenarios** - Use realistic estimates
- **Including discovery in implementation** - Separate spikes/research
- **Adding unnecessary features** - Stick to requirements
- **Over-engineering** - Simple solutions often work best

## Estimation Process

### Planning Poker Steps
1. **Present the task** - Read title and acceptance criteria
2. **Ask clarifying questions** - Ensure understanding
3. **Private estimation** - Each team member estimates silently
4. **Reveal estimates** - Show estimates simultaneously
5. **Discuss differences** - Focus on high/low outliers
6. **Re-estimate** - Converge on consensus estimate

### Estimation Considerations
- **Definition of Done:** Include testing, documentation, review
- **Team Velocity:** Consider team experience and capacity
- **Technical Debt:** Factor in code quality requirements
- **Dependencies:** Account for waiting time and coordination

## Velocity Tracking

### Team Capacity Planning
```
Sprint Capacity = Team Size × Sprint Duration × Focus Factor

Example:
3 developers × 2 weeks × 0.8 focus = 4.8 weeks = 24 days = ~48 story points

Focus Factor accounts for:
- Meetings and interruptions (20%)
- Code review and collaboration
- Bug fixes and support
- Learning and development
```

### Velocity Calculation
```
Velocity = Completed Story Points / Sprint Duration

Track over 3-5 sprints for stable average
Use for future sprint planning
```

### Velocity Factors
- **Team Experience:** New teams start lower, improve over time
- **Domain Knowledge:** Familiar domains allow higher velocity
- **Technical Debt:** High debt reduces velocity
- **Requirements Clarity:** Clear requirements increase velocity

## Calibration Examples

### E-commerce Feature: Product Search

#### Well-estimated (5 points)
```
Task: Implement product search with filters
Includes:
- Search input component
- Filter sidebar (category, price, rating)
- Results display with pagination
- Search API integration
- Basic search analytics

Rationale: Standard e-commerce pattern, existing API, familiar technology
```

#### Under-estimated (marked as 3, should be 8)
```
Task: Implement advanced search with AI recommendations
Missing considerations:
- Machine learning integration
- Recommendation algorithm
- A/B testing framework
- Performance optimization for large catalogs
- Advanced filtering with faceted search
```

### Backend API: User Management

#### Well-estimated (3 points)
```
Task: Create user profile update endpoint
Includes:
- Input validation
- Database update
- Error handling
- Unit tests
- API documentation

Rationale: Standard CRUD operation, existing user model, clear requirements
```

#### Over-estimated (marked as 8, should be 3)
```
Task: Simple user profile update
Over-engineered assumptions:
- Complex validation rules (not specified)
- Advanced security features (not required)
- Performance optimization (not needed)
- Complex audit logging (not requested)
```

## Estimation Best Practices

### Before Estimation
- [ ] Clarify requirements and acceptance criteria
- [ ] Identify dependencies and prerequisites
- [ ] Consider integration points
- [ ] Review similar past work

### During Estimation
- [ ] Focus on implementation effort, not calendar time
- [ ] Include testing and documentation
- [ ] Consider team experience with the technology
- [ ] Account for code review and iteration

### After Estimation
- [ ] Document assumptions and considerations
- [ ] Track actual vs estimated effort
- [ ] Update estimates based on new information
- [ ] Use learnings to improve future estimates