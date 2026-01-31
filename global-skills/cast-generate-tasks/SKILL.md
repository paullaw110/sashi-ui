---
name: cast-generate-tasks
description: Break down Product Requirements Documents (PRDs) into actionable development tasks with effort estimation and dependency mapping. Use this skill when users request "CAST GENERATE_TASKS" or need to convert comprehensive requirements into sprint-ready development tasks, GitHub issues, or project management items.
---

# CAST: GENERATE_TASKS

Convert Product Requirements Documents into structured, actionable development tasks with proper prioritization, estimation, and dependency tracking.

## What This Creates

A comprehensive task breakdown including:
- Individual development tasks with clear deliverables
- Effort estimation in story points
- Task dependencies and critical path identification
- Sprint assignment recommendations
- GitHub issue templates ready for creation
- Acceptance criteria mapped to tasks

## Usage Patterns

**Direct command:**
```
CAST: GENERATE_TASKS
```

**With specific scope:**
```
CAST: GENERATE_TASKS --scope backend
CAST: GENERATE_TASKS --scope frontend
CAST: GENERATE_TASKS --sprint 1
```

## Task Generation Process

### 1. PRD Analysis
- Parse user stories and acceptance criteria
- Identify technical requirements
- Extract dependencies and constraints
- Determine scope and complexity

### 2. Task Decomposition
- Break down features into implementable chunks
- Create tasks for each layer (frontend, backend, database)
- Generate supporting tasks (tests, documentation, deployment)
- Identify infrastructure and DevOps requirements

### 3. Estimation & Prioritization
- Apply story point estimation (1, 2, 3, 5, 8, 13)
- Identify critical path dependencies
- Suggest sprint assignments
- Flag high-risk or complex tasks

## Task Categories

### Development Tasks
- **Frontend:** UI components, pages, user interactions
- **Backend:** API endpoints, business logic, data processing
- **Database:** Schema changes, migrations, optimization
- **Integration:** Third-party services, internal APIs

### Supporting Tasks
- **Testing:** Unit tests, integration tests, E2E tests
- **Documentation:** API docs, user guides, technical specs
- **DevOps:** Deployment scripts, CI/CD, monitoring
- **Security:** Authentication, authorization, data protection

## Task Template Structure

Each generated task includes:
- **Title:** Clear, action-oriented description
- **Description:** Detailed requirements and context
- **Acceptance Criteria:** Specific, testable outcomes
- **Story Points:** Effort estimation (1-13 scale)
- **Dependencies:** Prerequisite tasks
- **Labels:** Task category, priority, component
- **Assignee Suggestions:** Based on skill requirements

## Integration with GitHub

### Issue Creation Scripts
- Automated GitHub issue generation
- Proper labeling and milestone assignment
- Template-based issue descriptions
- Epic and story linking

### Project Board Setup
- Sprint planning integration
- Kanban board configuration
- Automated workflow triggers

## Reference Materials

For detailed task generation patterns, see:
- [Task decomposition guide](references/task-decomposition.md)
- [Estimation guidelines](references/estimation.md)
- [GitHub integration](references/github-integration.md)

## Scripts Available

- **Task Generator:** `scripts/generate_tasks.py`
- **GitHub Issue Creator:** `scripts/create_github_issues.py`
- **Sprint Planner:** `scripts/plan_sprints.py`

## Quality Standards

Every task must include:
- ✅ Clear, actionable title
- ✅ Specific acceptance criteria
- ✅ Realistic effort estimation
- ✅ Identified dependencies
- ✅ Appropriate labeling
- ✅ Definition of done