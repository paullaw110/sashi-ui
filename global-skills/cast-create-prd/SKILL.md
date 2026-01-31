---
name: cast-create-prd
description: Generate comprehensive Product Requirements Documents (PRDs) for software features and projects. Use this skill when users request "CAST CREATE_PRD [feature name]" or need to create formal requirements documentation, user stories, acceptance criteria, technical specifications, or project planning documents for software development.
---

# CAST: CREATE_PRD

Generate comprehensive Product Requirements Documents that serve as the foundation for feature development workflows.

## What This Creates

A complete PRD including:
- Executive summary and problem statement
- Stakeholder analysis and user personas
- Detailed user stories with acceptance criteria
- Technical requirements and constraints
- Success metrics and KPIs
- Implementation timeline and milestones

## Usage Patterns

**Direct command:**
```
CAST: CREATE_PRD [feature name]
```

**Examples:**
- `CAST: CREATE_PRD dashboard analytics`
- `CAST: CREATE_PRD user authentication system`
- `CAST: CREATE_PRD mobile app payment flow`

## PRD Template Structure

### 1. Executive Summary
- Problem statement
- Solution overview
- Business impact
- Success criteria

### 2. Stakeholder Analysis
- Primary stakeholders
- User personas
- Decision makers
- Technical reviewers

### 3. User Stories & Acceptance Criteria
- Feature breakdown
- User journey mapping
- Acceptance criteria (testable)
- Edge cases and error handling

### 4. Technical Requirements
- System architecture considerations
- API requirements
- Database schema needs
- Performance requirements
- Security considerations
- Third-party integrations

### 5. Success Metrics
- Key performance indicators
- Analytics tracking requirements
- A/B testing plan
- Success thresholds

### 6. Implementation Plan
- Development phases
- Timeline estimates
- Resource requirements
- Risk assessment
- Dependencies

## Integration with Other CAST Skills

The PRD output is designed to work seamlessly with:
- `CAST: GENERATE_TASKS` - Converts PRD into actionable dev tasks
- `CAST: GENERATE_TESTS` - Creates test specs from acceptance criteria
- `CAST: IMPLEMENT_FEATURE` - Uses PRD as implementation guide

## Reference Materials

For detailed PRD templates and examples, see:
- [PRD template](references/prd-template.md)
- [User story formats](references/user-stories.md)
- [Technical requirements checklist](references/tech-requirements.md)

## Quality Standards

Every PRD must include:
- ✅ Clear, measurable acceptance criteria
- ✅ Defined success metrics
- ✅ Technical feasibility assessment
- ✅ User experience considerations
- ✅ Security and privacy requirements
- ✅ Performance benchmarks