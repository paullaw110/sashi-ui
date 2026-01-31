#!/usr/bin/env python3
"""
Generate development tasks from PRD content
"""
import json
import re
import argparse
from typing import List, Dict, Any

class TaskGenerator:
    def __init__(self):
        self.task_templates = {
            'feature': {
                'frontend': 1.5,  # Multiplier for frontend tasks
                'backend': 1.2,   # Multiplier for backend tasks
                'database': 1.0,  # Base complexity
                'testing': 0.8,   # Testing is typically smaller
                'devops': 1.3     # DevOps can be complex
            }
        }
        
    def parse_prd_content(self, prd_text: str) -> Dict[str, Any]:
        """Extract structured data from PRD text"""
        sections = {}
        
        # Extract user stories
        user_stories = re.findall(r'As a (.+?)\nI want (.+?)\nSo that (.+?)(?:\n\n|\nAcceptance)', prd_text, re.MULTILINE | re.DOTALL)
        sections['user_stories'] = [
            {'persona': story[0].strip(), 'want': story[1].strip(), 'value': story[2].strip()}
            for story in user_stories
        ]
        
        # Extract acceptance criteria
        criteria_blocks = re.findall(r'Acceptance Criteria:(.*?)(?=\n\n|\n#|\Z)', prd_text, re.MULTILINE | re.DOTALL)
        sections['acceptance_criteria'] = []
        for block in criteria_blocks:
            criteria = re.findall(r'✅ (.+)', block)
            sections['acceptance_criteria'].extend(criteria)
        
        # Extract technical requirements
        tech_section = re.search(r'Technical Requirements(.*?)(?=\n## |\Z)', prd_text, re.MULTILINE | re.DOTALL)
        if tech_section:
            sections['technical_requirements'] = tech_section.group(1).strip()
        
        return sections
    
    def estimate_complexity(self, task_description: str, task_type: str) -> int:
        """Estimate story points based on description and type"""
        complexity_keywords = {
            'simple': 1,
            'basic': 1,
            'create': 2,
            'implement': 3,
            'complex': 5,
            'integration': 5,
            'authentication': 5,
            'real-time': 8,
            'optimization': 8,
            'migration': 8
        }
        
        base_points = 2
        description_lower = task_description.lower()
        
        for keyword, points in complexity_keywords.items():
            if keyword in description_lower:
                base_points = max(base_points, points)
        
        # Apply type multiplier
        multiplier = self.task_templates['feature'].get(task_type, 1.0)
        final_points = int(base_points * multiplier)
        
        # Ensure points are in Fibonacci sequence
        fibonacci_points = [1, 2, 3, 5, 8, 13]
        return min(fibonacci_points, key=lambda x: abs(x - final_points))
    
    def generate_tasks_from_story(self, story: Dict[str, str], story_index: int) -> List[Dict[str, Any]]:
        """Generate development tasks from a user story"""
        tasks = []
        story_id = f"story-{story_index + 1}"
        
        # Frontend tasks
        frontend_task = {
            'title': f"Implement UI for {story['want']}",
            'description': f"Create user interface components to support: {story['want']}",
            'type': 'frontend',
            'story_points': self.estimate_complexity(story['want'], 'frontend'),
            'labels': ['frontend', 'feature'],
            'story_id': story_id,
            'acceptance_criteria': [
                f"User can {story['want']} through the UI",
                "UI is responsive and accessible",
                "Error states are handled gracefully"
            ]
        }
        tasks.append(frontend_task)
        
        # Backend tasks
        backend_task = {
            'title': f"Implement API for {story['want']}",
            'description': f"Create backend endpoints and business logic for: {story['want']}",
            'type': 'backend',
            'story_points': self.estimate_complexity(story['want'], 'backend'),
            'labels': ['backend', 'api'],
            'story_id': story_id,
            'acceptance_criteria': [
                "API endpoints are created and documented",
                "Business logic is implemented correctly",
                "Input validation is in place",
                "Error responses are standardized"
            ]
        }
        tasks.append(backend_task)
        
        # Database tasks (if needed)
        if any(keyword in story['want'].lower() for keyword in ['save', 'store', 'create', 'update', 'delete']):
            db_task = {
                'title': f"Database schema for {story['want']}",
                'description': f"Create or modify database schema to support: {story['want']}",
                'type': 'database',
                'story_points': self.estimate_complexity(story['want'], 'database'),
                'labels': ['database', 'schema'],
                'story_id': story_id,
                'acceptance_criteria': [
                    "Database schema supports required data",
                    "Proper indexes are created",
                    "Migration script is provided"
                ]
            }
            tasks.append(db_task)
        
        # Testing tasks
        test_task = {
            'title': f"Tests for {story['want']}",
            'description': f"Create comprehensive tests for: {story['want']}",
            'type': 'testing',
            'story_points': max(1, sum(t['story_points'] for t in tasks) // 3),
            'labels': ['testing', 'quality'],
            'story_id': story_id,
            'dependencies': [t['title'] for t in tasks],
            'acceptance_criteria': [
                "Unit tests cover business logic",
                "Integration tests verify API endpoints",
                "E2E tests cover user workflows"
            ]
        }
        tasks.append(test_task)
        
        return tasks
    
    def generate_supporting_tasks(self, all_tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate supporting tasks for the project"""
        supporting_tasks = []
        
        # DevOps tasks
        devops_tasks = [
            {
                'title': 'Setup CI/CD pipeline',
                'description': 'Configure automated testing and deployment pipeline',
                'type': 'devops',
                'story_points': 5,
                'labels': ['devops', 'infrastructure'],
                'acceptance_criteria': [
                    'Automated tests run on every PR',
                    'Automated deployment to staging',
                    'Production deployment workflow defined'
                ]
            },
            {
                'title': 'Configure monitoring and alerts',
                'description': 'Setup application monitoring, logging, and alerting',
                'type': 'devops',
                'story_points': 3,
                'labels': ['devops', 'monitoring'],
                'acceptance_criteria': [
                    'Application metrics are collected',
                    'Error tracking is configured',
                    'Performance monitoring is active'
                ]
            }
        ]
        
        # Documentation tasks
        doc_tasks = [
            {
                'title': 'API documentation',
                'description': 'Create comprehensive API documentation',
                'type': 'documentation',
                'story_points': 2,
                'labels': ['documentation', 'api'],
                'acceptance_criteria': [
                    'All endpoints are documented',
                    'Request/response examples provided',
                    'Authentication requirements specified'
                ]
            },
            {
                'title': 'User guide documentation',
                'description': 'Create user-facing documentation and guides',
                'type': 'documentation',
                'story_points': 3,
                'labels': ['documentation', 'user-guide'],
                'acceptance_criteria': [
                    'User workflows are documented',
                    'Screenshots and examples included',
                    'Troubleshooting guide provided'
                ]
            }
        ]
        
        supporting_tasks.extend(devops_tasks)
        supporting_tasks.extend(doc_tasks)
        
        return supporting_tasks
    
    def assign_priorities(self, tasks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Assign priorities to tasks based on dependencies and type"""
        # Critical path: database -> backend -> frontend -> testing
        priority_order = ['database', 'backend', 'frontend', 'testing', 'devops', 'documentation']
        
        for task in tasks:
            task_type = task['type']
            if task_type in priority_order:
                priority_index = priority_order.index(task_type)
                if priority_index <= 1:
                    task['priority'] = 'high'
                elif priority_index <= 3:
                    task['priority'] = 'medium'
                else:
                    task['priority'] = 'low'
            else:
                task['priority'] = 'medium'
        
        return tasks
    
    def organize_into_sprints(self, tasks: List[Dict[str, Any]], sprint_capacity: int = 20) -> Dict[str, List[Dict[str, Any]]]:
        """Organize tasks into sprints based on dependencies and capacity"""
        sprints = {}
        current_sprint = 1
        current_capacity = 0
        
        # Sort by priority and dependencies
        sorted_tasks = sorted(tasks, key=lambda x: (
            x['priority'] == 'low',
            x['priority'] == 'medium',
            x['priority'] == 'high',
            -x['story_points']
        ))
        
        for task in sorted_tasks:
            task_points = task['story_points']
            
            # Check if task fits in current sprint
            if current_capacity + task_points > sprint_capacity:
                current_sprint += 1
                current_capacity = 0
            
            sprint_key = f"Sprint {current_sprint}"
            if sprint_key not in sprints:
                sprints[sprint_key] = []
            
            sprints[sprint_key].append(task)
            current_capacity += task_points
        
        return sprints
    
    def generate_all_tasks(self, prd_content: str, sprint_capacity: int = 20) -> Dict[str, Any]:
        """Generate complete task breakdown from PRD"""
        parsed_prd = self.parse_prd_content(prd_content)
        all_tasks = []
        
        # Generate tasks from user stories
        for i, story in enumerate(parsed_prd['user_stories']):
            story_tasks = self.generate_tasks_from_story(story, i)
            all_tasks.extend(story_tasks)
        
        # Add supporting tasks
        supporting_tasks = self.generate_supporting_tasks(all_tasks)
        all_tasks.extend(supporting_tasks)
        
        # Assign priorities
        all_tasks = self.assign_priorities(all_tasks)
        
        # Organize into sprints
        sprints = self.organize_into_sprints(all_tasks, sprint_capacity)
        
        # Calculate summary statistics
        total_points = sum(task['story_points'] for task in all_tasks)
        task_count_by_type = {}
        for task in all_tasks:
            task_type = task['type']
            task_count_by_type[task_type] = task_count_by_type.get(task_type, 0) + 1
        
        return {
            'tasks': all_tasks,
            'sprints': sprints,
            'summary': {
                'total_tasks': len(all_tasks),
                'total_story_points': total_points,
                'task_breakdown': task_count_by_type,
                'estimated_duration': f"{len(sprints)} sprints"
            }
        }

def main():
    parser = argparse.ArgumentParser(description='Generate development tasks from PRD')
    parser.add_argument('prd_file', help='Path to PRD file')
    parser.add_argument('--output', '-o', default='generated_tasks.json', help='Output JSON file')
    parser.add_argument('--sprint-capacity', '-c', type=int, default=20, help='Sprint capacity in story points')
    
    args = parser.parse_args()
    
    # Read PRD content
    try:
        with open(args.prd_file, 'r') as f:
            prd_content = f.read()
    except FileNotFoundError:
        print(f"Error: PRD file '{args.prd_file}' not found")
        return 1
    
    # Generate tasks
    generator = TaskGenerator()
    result = generator.generate_all_tasks(prd_content, args.sprint_capacity)
    
    # Save to output file
    with open(args.output, 'w') as f:
        json.dump(result, f, indent=2)
    
    # Print summary
    summary = result['summary']
    print(f"Generated {summary['total_tasks']} tasks ({summary['total_story_points']} story points)")
    print(f"Estimated duration: {summary['estimated_duration']}")
    print(f"Task breakdown: {summary['task_breakdown']}")
    print(f"Output saved to: {args.output}")
    
    return 0

if __name__ == '__main__':
    exit(main())