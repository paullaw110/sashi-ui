#!/usr/bin/env python3
"""
Create GitHub issues from generated tasks
"""
import json
import subprocess
import argparse
import sys
from typing import Dict, List, Any

class GitHubIssueCreator:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        
    def check_gh_cli(self) -> bool:
        """Check if GitHub CLI is installed and authenticated"""
        try:
            result = subprocess.run(['gh', 'auth', 'status'], 
                                  capture_output=True, text=True)
            if result.returncode != 0:
                print("Error: GitHub CLI not authenticated. Run 'gh auth login' first.")
                return False
            return True
        except FileNotFoundError:
            print("Error: GitHub CLI not found. Install from https://cli.github.com/")
            return False
    
    def create_milestone(self, title: str, description: str, due_date: str = None) -> bool:
        """Create a milestone for sprint organization"""
        if self.dry_run:
            print(f"[DRY RUN] Would create milestone: {title}")
            return True
            
        cmd = ['gh', 'api', 'repos/:owner/:repo/milestones', '--method', 'POST',
               '--field', f'title={title}',
               '--field', f'description={description}']
        
        if due_date:
            cmd.extend(['--field', f'due_on={due_date}'])
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                print(f"Created milestone: {title}")
                return True
            else:
                # Milestone might already exist
                if "already_exists" in result.stderr:
                    print(f"Milestone '{title}' already exists")
                    return True
                else:
                    print(f"Error creating milestone: {result.stderr}")
                    return False
        except Exception as e:
            print(f"Error creating milestone: {e}")
            return False
    
    def format_issue_body(self, task: Dict[str, Any]) -> str:
        """Format task as GitHub issue body"""
        body = f"""## Description
{task['description']}

## Acceptance Criteria
"""
        for criterion in task.get('acceptance_criteria', []):
            body += f"- [ ] {criterion}\n"
        
        body += f"""
## Technical Details
- **Story Points:** {task['story_points']}
- **Type:** {task['type']}
- **Priority:** {task.get('priority', 'medium')}
"""
        
        if task.get('story_id'):
            body += f"- **User Story:** {task['story_id']}\n"
        
        if task.get('dependencies'):
            body += f"- **Dependencies:** {', '.join(task['dependencies'])}\n"
        
        body += """
## Definition of Done
- [ ] Code implemented and tested
- [ ] Code review completed
- [ ] Documentation updated
- [ ] Acceptance criteria verified
"""
        
        return body
    
    def create_issue(self, task: Dict[str, Any], milestone: str = None) -> str:
        """Create a GitHub issue from a task"""
        title = task['title']
        body = self.format_issue_body(task)
        labels = task.get('labels', [])
        
        # Add size label based on story points
        size_map = {1: 'size/XS', 2: 'size/S', 3: 'size/M', 5: 'size/L', 8: 'size/XL', 13: 'size/XXL'}
        size_label = size_map.get(task['story_points'], 'size/M')
        labels.append(size_label)
        
        # Add priority label
        priority = task.get('priority', 'medium')
        labels.append(f'priority/{priority}')
        
        if self.dry_run:
            print(f"[DRY RUN] Would create issue: {title}")
            print(f"  Labels: {', '.join(labels)}")
            if milestone:
                print(f"  Milestone: {milestone}")
            return f"#{len(title)}"  # Mock issue number
        
        cmd = ['gh', 'issue', 'create',
               '--title', title,
               '--body', body,
               '--label', ','.join(labels)]
        
        if milestone:
            cmd.extend(['--milestone', milestone])
        
        try:
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                issue_url = result.stdout.strip()
                issue_number = issue_url.split('/')[-1]
                print(f"Created issue #{issue_number}: {title}")
                return issue_number
            else:
                print(f"Error creating issue '{title}': {result.stderr}")
                return None
        except Exception as e:
            print(f"Error creating issue '{title}': {e}")
            return None
    
    def create_epic_issues(self, sprints: Dict[str, List[Dict[str, Any]]]) -> Dict[str, str]:
        """Create epic issues for each sprint"""
        epic_issues = {}
        
        for sprint_name, tasks in sprints.items():
            total_points = sum(task['story_points'] for task in tasks)
            task_count = len(tasks)
            
            epic_title = f"Epic: {sprint_name}"
            epic_body = f"""# {sprint_name}
            
## Overview
Sprint containing {task_count} tasks with {total_points} story points total.

## Sprint Goals
- Complete core feature development
- Maintain high code quality
- Ensure proper testing coverage

## Tasks in This Sprint
"""
            
            for task in tasks:
                epic_body += f"- [ ] {task['title']} ({task['story_points']} pts)\n"
            
            epic_body += f"""
## Sprint Metrics
- **Total Tasks:** {task_count}
- **Total Story Points:** {total_points}
- **Sprint Capacity:** {total_points} points

## Definition of Done
- [ ] All tasks completed
- [ ] Code reviews completed
- [ ] Integration testing passed
- [ ] Sprint demo conducted
"""
            
            epic_task = {
                'title': epic_title,
                'description': f"Epic for {sprint_name}",
                'type': 'epic',
                'story_points': total_points,
                'labels': ['epic', 'sprint'],
                'acceptance_criteria': [
                    'All sprint tasks completed',
                    'Sprint goals achieved',
                    'Quality standards maintained'
                ]
            }
            
            # Override body for epic
            if self.dry_run:
                print(f"[DRY RUN] Would create epic: {epic_title}")
                epic_issues[sprint_name] = f"#{len(epic_title)}"
            else:
                cmd = ['gh', 'issue', 'create',
                       '--title', epic_title,
                       '--body', epic_body,
                       '--label', 'epic,sprint']
                
                try:
                    result = subprocess.run(cmd, capture_output=True, text=True)
                    if result.returncode == 0:
                        issue_url = result.stdout.strip()
                        issue_number = issue_url.split('/')[-1]
                        epic_issues[sprint_name] = issue_number
                        print(f"Created epic #{issue_number}: {epic_title}")
                    else:
                        print(f"Error creating epic '{epic_title}': {result.stderr}")
                except Exception as e:
                    print(f"Error creating epic '{epic_title}': {e}")
        
        return epic_issues
    
    def process_task_file(self, task_file: str, create_milestones: bool = True) -> bool:
        """Process generated tasks file and create GitHub issues"""
        try:
            with open(task_file, 'r') as f:
                data = json.load(f)
        except FileNotFoundError:
            print(f"Error: Task file '{task_file}' not found")
            return False
        except json.JSONDecodeError as e:
            print(f"Error parsing task file: {e}")
            return False
        
        tasks = data.get('tasks', [])
        sprints = data.get('sprints', {})
        
        if not tasks:
            print("No tasks found in file")
            return False
        
        print(f"Processing {len(tasks)} tasks across {len(sprints)} sprints...")
        
        # Create milestones for sprints
        if create_milestones:
            for sprint_name in sprints.keys():
                milestone_desc = f"Development sprint: {sprint_name}"
                self.create_milestone(sprint_name, milestone_desc)
        
        # Create epic issues for sprints
        epic_issues = self.create_epic_issues(sprints)
        
        # Create individual task issues
        created_issues = []
        for sprint_name, sprint_tasks in sprints.items():
            print(f"\nCreating issues for {sprint_name}...")
            
            for task in sprint_tasks:
                issue_number = self.create_issue(task, sprint_name if create_milestones else None)
                if issue_number:
                    created_issues.append({
                        'number': issue_number,
                        'title': task['title'],
                        'sprint': sprint_name
                    })
        
        # Summary
        print(f"\n✅ Created {len(created_issues)} issues")
        print(f"✅ Created {len(epic_issues)} epic issues")
        if create_milestones:
            print(f"✅ Created {len(sprints)} milestones")
        
        return True

def main():
    parser = argparse.ArgumentParser(description='Create GitHub issues from generated tasks')
    parser.add_argument('task_file', help='Path to generated tasks JSON file')
    parser.add_argument('--dry-run', action='store_true', 
                       help='Show what would be created without actually creating')
    parser.add_argument('--no-milestones', action='store_true',
                       help='Skip milestone creation')
    
    args = parser.parse_args()
    
    creator = GitHubIssueCreator(dry_run=args.dry_run)
    
    # Check prerequisites
    if not args.dry_run and not creator.check_gh_cli():
        return 1
    
    # Process tasks and create issues
    success = creator.process_task_file(
        args.task_file, 
        create_milestones=not args.no_milestones
    )
    
    return 0 if success else 1

if __name__ == '__main__':
    exit(main())