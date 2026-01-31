# GitHub Integration Guide

## Issue Creation Workflow

### Automated Issue Generation
Use GitHub CLI (`gh`) to create issues programmatically from generated tasks:

```bash
# Create issue with labels and milestone
gh issue create \
  --title "Implement user authentication API" \
  --body-file issue-template.md \
  --label "backend,priority/high" \
  --milestone "Sprint 1" \
  --assignee "developer-username"
```

### Issue Template Structure
```markdown
## Description
Brief description of the task and its purpose.

## Acceptance Criteria
- [ ] Specific, testable requirement 1
- [ ] Specific, testable requirement 2
- [ ] Error handling requirement
- [ ] Testing requirement

## Technical Details
- **Story Points:** 5
- **Component:** Authentication
- **Dependencies:** #123, #124

## Definition of Done
- [ ] Code implemented and tested
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Deployed to staging
```

## Project Board Setup

### Column Structure
```
Backlog → Sprint Backlog → In Progress → In Review → Testing → Done
```

### Automated Workflows
```yaml
# .github/workflows/project-automation.yml
name: Project Automation
on:
  issues:
    types: [opened, closed]
  pull_request:
    types: [opened, closed]

jobs:
  project_automation:
    runs-on: ubuntu-latest
    steps:
      - name: Add to project
        uses: actions/add-to-project@v0.4.0
        with:
          project-url: https://github.com/users/username/projects/1
          github-token: ${{ secrets.ADD_TO_PROJECT_PAT }}
```

## Label System

### Priority Labels
- `priority/critical` - P0: Production issues, security vulnerabilities
- `priority/high` - P1: Important features, major bugs
- `priority/medium` - P2: Standard features, minor improvements
- `priority/low` - P3: Nice to have, technical debt

### Component Labels
- `component/frontend` - UI, React components, styling
- `component/backend` - API, business logic, database
- `component/devops` - CI/CD, infrastructure, deployment
- `component/testing` - Test automation, QA
- `component/docs` - Documentation, user guides

### Type Labels
- `type/feature` - New functionality
- `type/bug` - Bug fixes
- `type/enhancement` - Improvements to existing features
- `type/refactor` - Code quality improvements
- `type/spike` - Research and investigation

### Size Labels (Story Points)
- `size/XS` - 1 point
- `size/S` - 2 points
- `size/M` - 3 points
- `size/L` - 5 points
- `size/XL` - 8 points

### Status Labels
- `status/blocked` - Cannot proceed due to dependency
- `status/in-review` - Under code review
- `status/needs-info` - Requires additional information
- `status/ready` - Ready for development

## Epic and Story Linking

### Epic Issue Template
```markdown
# Epic: [Epic Name]

## Overview
High-level description of the epic and its business value.

## User Stories
- [ ] #123 - Story title 1
- [ ] #124 - Story title 2
- [ ] #125 - Story title 3

## Acceptance Criteria
Epic-level acceptance criteria that span multiple stories.

## Definition of Done
- [ ] All user stories completed
- [ ] Integration testing passed
- [ ] Documentation updated
- [ ] Feature deployed to production
```

### Story-Epic Relationships
```markdown
<!-- In individual story issues -->
**Epic:** #456 Epic Title
**Depends on:** #123, #124
**Blocks:** #127
```

## Sprint Planning Integration

### Milestone Creation
```bash
# Create sprint milestone
gh api repos/:owner/:repo/milestones \
  --method POST \
  --field title="Sprint 1" \
  --field description="Sprint 1: January 15-28, 2024" \
  --field due_on="2024-01-28T23:59:59Z"
```

### Issue Assignment to Sprints
```bash
# Assign issues to milestone
gh issue edit 123 --milestone "Sprint 1"
gh issue edit 124 --milestone "Sprint 1"
```

### Sprint Board Views
```markdown
## Sprint 1 Board

### To Do (8 issues, 34 points)
- [ ] #123 Implement authentication (5 pts)
- [ ] #124 Create user dashboard (8 pts)
- [ ] #125 Setup CI/CD pipeline (3 pts)

### In Progress (2 issues, 8 points)
- [ ] #126 User registration form (3 pts)
- [ ] #127 Database schema migration (5 pts)

### Done (3 issues, 13 points)
- [x] #128 Project setup (2 pts)
- [x] #129 Environment configuration (3 pts)
- [x] #130 Initial deployment (8 pts)
```

## Bulk Operations

### Mass Issue Creation Script
```python
#!/usr/bin/env python3
"""
Create multiple GitHub issues from a task list
"""
import json
import subprocess
import sys

def create_issue(title, body, labels, milestone=None, assignee=None):
    """Create a GitHub issue using gh CLI"""
    cmd = [
        'gh', 'issue', 'create',
        '--title', title,
        '--body', body,
        '--label', ','.join(labels)
    ]
    
    if milestone:
        cmd.extend(['--milestone', milestone])
    if assignee:
        cmd.extend(['--assignee', assignee])
    
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode == 0:
        print(f"Created issue: {title}")
        return result.stdout.strip()
    else:
        print(f"Error creating issue {title}: {result.stderr}")
        return None

def load_tasks_from_json(filename):
    """Load tasks from JSON file"""
    with open(filename, 'r') as f:
        return json.load(f)

# Example usage
if __name__ == "__main__":
    tasks = load_tasks_from_json('generated_tasks.json')
    
    for task in tasks:
        create_issue(
            title=task['title'],
            body=task['description'],
            labels=task['labels'],
            milestone=task.get('milestone'),
            assignee=task.get('assignee')
        )
```

### Task JSON Structure
```json
{
  "tasks": [
    {
      "title": "Implement user authentication API",
      "description": "Create login and registration endpoints with JWT token management",
      "labels": ["backend", "priority/high", "size/L"],
      "milestone": "Sprint 1",
      "assignee": "backend-dev",
      "story_points": 5,
      "dependencies": ["#123", "#124"],
      "acceptance_criteria": [
        "POST /auth/login endpoint accepts email/password",
        "Returns JWT token on successful authentication",
        "Returns 401 for invalid credentials"
      ]
    }
  ]
}
```

## Progress Tracking

### Burndown Chart Data
```bash
# Get sprint progress
gh api graphql -f query='
query($owner: String!, $repo: String!, $milestone: Int!) {
  repository(owner: $owner, name: $repo) {
    milestone(number: $milestone) {
      issues(first: 100) {
        nodes {
          state
          labels(first: 10) {
            nodes { name }
          }
        }
      }
    }
  }
}' -f owner="username" -f repo="repository" -f milestone=1
```

### Sprint Reports
```python
def generate_sprint_report(milestone):
    """Generate sprint completion report"""
    # Query GitHub API for milestone data
    # Calculate completion percentages
    # Generate summary report
    pass
```

## Integration with Development Workflow

### Branch Naming Convention
```bash
# Create feature branch linked to issue
git checkout -b feature/123-user-authentication
git push -u origin feature/123-user-authentication
```

### Pull Request Templates
```markdown
## Related Issue
Fixes #123

## Description
Brief description of changes made

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
```

### Auto-linking Issues
```markdown
<!-- In commit messages -->
git commit -m "feat: implement user authentication (closes #123)"

<!-- In PR descriptions -->
This PR implements user authentication as described in #123
```

## Reporting and Analytics

### Issue Metrics
- Cycle time (issue creation to completion)
- Lead time (requirement to delivery)
- Throughput (issues completed per sprint)
- Velocity (story points completed per sprint)

### GitHub Actions for Reporting
```yaml
name: Sprint Metrics
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM

jobs:
  generate_metrics:
    runs-on: ubuntu-latest
    steps:
      - name: Generate Sprint Report
        run: |
          # Script to collect metrics and generate report
          python scripts/generate_sprint_report.py
```