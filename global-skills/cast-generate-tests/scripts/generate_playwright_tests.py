#!/usr/bin/env python3
"""
Generate Playwright tests from PRD acceptance criteria
"""
import re
import os
import argparse
from typing import List, Dict, Any
import json

class PlaywrightTestGenerator:
    def __init__(self):
        self.test_templates = {
            'e2e': self.generate_e2e_test,
            'api': self.generate_api_test,
            'visual': self.generate_visual_test,
            'performance': self.generate_performance_test
        }
        
    def parse_acceptance_criteria(self, prd_content: str) -> List[Dict[str, Any]]:
        """Extract acceptance criteria from PRD content"""
        criteria_blocks = []
        
        # Find user stories with acceptance criteria
        story_pattern = r'As a (.+?)\nI want (.+?)\nSo that (.+?)(?:\n\n|\nAcceptance Criteria:(.+?)(?=\n\n|\n##|\Z))'
        stories = re.findall(story_pattern, prd_content, re.MULTILINE | re.DOTALL)
        
        for i, story in enumerate(stories):
            persona, want, value, criteria_text = story
            
            # Extract individual criteria
            criteria = []
            if criteria_text:
                criteria_lines = re.findall(r'✅ (.+)', criteria_text)
                criteria.extend(criteria_lines)
            
            story_data = {
                'id': f'story-{i+1}',
                'persona': persona.strip(),
                'want': want.strip(),
                'value': value.strip(),
                'acceptance_criteria': criteria,
                'test_scenarios': self.generate_test_scenarios(want.strip(), criteria)
            }
            
            criteria_blocks.append(story_data)
        
        return criteria_blocks
    
    def generate_test_scenarios(self, want: str, criteria: List[str]) -> List[Dict[str, Any]]:
        """Generate test scenarios from acceptance criteria"""
        scenarios = []
        
        for i, criterion in enumerate(criteria):
            scenario = {
                'id': f'scenario-{i+1}',
                'description': criterion,
                'test_type': self.determine_test_type(criterion),
                'steps': self.extract_test_steps(criterion),
                'expected_outcome': self.extract_expected_outcome(criterion)
            }
            scenarios.append(scenario)
        
        return scenarios
    
    def determine_test_type(self, criterion: str) -> str:
        """Determine the type of test needed for a criterion"""
        criterion_lower = criterion.lower()
        
        if any(keyword in criterion_lower for keyword in ['api', 'endpoint', 'request', 'response']):
            return 'api'
        elif any(keyword in criterion_lower for keyword in ['page load', 'performance', 'speed', 'fast']):
            return 'performance'
        elif any(keyword in criterion_lower for keyword in ['look', 'appear', 'display', 'visible']):
            return 'visual'
        else:
            return 'e2e'
    
    def extract_test_steps(self, criterion: str) -> List[str]:
        """Extract Given-When-Then steps from acceptance criteria"""
        steps = []
        
        # Look for Given-When-Then format
        gwt_pattern = r'Given (.+?), when (.+?), then (.+)'
        gwt_match = re.search(gwt_pattern, criterion, re.IGNORECASE)
        
        if gwt_match:
            given, when, then = gwt_match.groups()
            steps = [
                f"Given {given.strip()}",
                f"When {when.strip()}",
                f"Then {then.strip()}"
            ]
        else:
            # Extract actions from the criterion
            if 'when' in criterion.lower():
                parts = criterion.split('when', 1)
                if len(parts) == 2:
                    condition = parts[0].strip()
                    action_and_result = parts[1].strip()
                    
                    if 'then' in action_and_result:
                        action, result = action_and_result.split('then', 1)
                        steps = [
                            f"Given {condition}",
                            f"When {action.strip()}",
                            f"Then {result.strip()}"
                        ]
                    else:
                        steps = [
                            f"Given {condition}",
                            f"When {action_and_result}"
                        ]
            else:
                steps = [f"Test: {criterion}"]
        
        return steps
    
    def extract_expected_outcome(self, criterion: str) -> str:
        """Extract the expected outcome from acceptance criteria"""
        # Look for 'then' clause
        then_match = re.search(r'then (.+)', criterion, re.IGNORECASE)
        if then_match:
            return then_match.group(1).strip()
        
        # Look for 'should' statements
        should_match = re.search(r'should (.+)', criterion, re.IGNORECASE)
        if should_match:
            return should_match.group(1).strip()
        
        return criterion
    
    def generate_e2e_test(self, story: Dict[str, Any]) -> str:
        """Generate end-to-end Playwright test"""
        test_content = f"""import {{ test, expect }} from '@playwright/test';
import {{ {self.get_page_object_name(story['want'])} }} from '../pages/{self.get_page_object_name(story['want'])}';

test.describe('{story['want']}', () => {{
  let page{self.get_page_object_name(story['want'])}: {self.get_page_object_name(story['want'])};

  test.beforeEach(async ({{ page }}) => {{
    page{self.get_page_object_name(story['want'])} = new {self.get_page_object_name(story['want'])}(page);
    await page{self.get_page_object_name(story['want'])}.navigate();
  }});
"""
        
        for i, scenario in enumerate(story['test_scenarios']):
            if scenario['test_type'] == 'e2e':
                test_content += f"""
  test('{scenario['description']}', async ({{ page }}) => {{
"""
                for step in scenario['steps']:
                    test_content += f"    // {step}\n"
                
                test_content += self.generate_test_actions(scenario)
                test_content += f"""
    // Verify: {scenario['expected_outcome']}
    await expect(page.locator('[data-testid="result"]')).toContainText('{scenario['expected_outcome']}');
  }});
"""
        
        test_content += "});\n"
        return test_content
    
    def generate_api_test(self, story: Dict[str, Any]) -> str:
        """Generate API test"""
        test_content = f"""import {{ test, expect }} from '@playwright/test';

test.describe('{story['want']} API', () => {{
"""
        
        for scenario in story['test_scenarios']:
            if scenario['test_type'] == 'api':
                test_content += f"""
  test('{scenario['description']}', async ({{ request }}) => {{
    // API test for: {scenario['expected_outcome']}
    const response = await request.get('/api/endpoint');
    
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('success', true);
  }});
"""
        
        test_content += "});\n"
        return test_content
    
    def generate_visual_test(self, story: Dict[str, Any]) -> str:
        """Generate visual regression test"""
        test_content = f"""import {{ test, expect }} from '@playwright/test';

test.describe('{story['want']} Visual Tests', () => {{
  test('visual appearance matches design', async ({{ page }}) => {{
    await page.goto('/feature');
    
    // Wait for content to load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot for visual regression
    await expect(page).toHaveScreenshot('feature-page.png');
  }});

  test('responsive design across devices', async ({{ page }}) => {{
    const viewports = [
      {{ width: 375, height: 667 }}, // iPhone SE
      {{ width: 768, height: 1024 }}, // iPad
      {{ width: 1920, height: 1080 }} // Desktop
    ];

    for (const viewport of viewports) {{
      await page.setViewportSize(viewport);
      await page.goto('/feature');
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot(`feature-${{viewport.width}}x${{viewport.height}}.png`);
    }}
  }});
}});
"""
        return test_content
    
    def generate_performance_test(self, story: Dict[str, Any]) -> str:
        """Generate performance test"""
        test_content = f"""import {{ test, expect }} from '@playwright/test';

test.describe('{story['want']} Performance', () => {{
  test('meets performance benchmarks', async ({{ page }}) => {{
    const startTime = Date.now();
    
    await page.goto('/feature');
    
    // Measure page load time
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000); // 3 seconds max
    
    // Measure Core Web Vitals
    const lcp = await page.evaluate(() => {{
      return new Promise((resolve) => {{
        new PerformanceObserver((list) => {{
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        }}).observe({{ type: 'largest-contentful-paint', buffered: true }});
      }});
    }});
    
    expect(lcp).toBeLessThan(2500); // 2.5 seconds
  }});

  test('handles high load efficiently', async ({{ page }}) => {{
    // Simulate high load scenarios
    const promises = [];
    
    for (let i = 0; i < 10; i++) {{
      promises.push(
        page.evaluate(() => fetch('/api/data'))
      );
    }}
    
    const responses = await Promise.all(promises);
    
    // Verify all requests completed successfully
    for (const response of responses) {{
      expect(response.ok).toBeTruthy();
    }}
  }});
}});
"""
        return test_content
    
    def generate_page_object(self, story: Dict[str, Any]) -> str:
        """Generate page object class"""
        class_name = self.get_page_object_name(story['want'])
        
        page_object = f"""import {{ Page }} from '@playwright/test';

export class {class_name} {{
  constructor(private page: Page) {{}}

  async navigate() {{
    await this.page.goto('/feature');
    await this.page.waitForLoadState('networkidle');
  }}

"""
        
        # Generate methods based on interactions mentioned in acceptance criteria
        interactions = self.extract_interactions(story)
        
        for interaction in interactions:
            page_object += f"""  async {interaction['method']}({interaction['params']}) {{
    {interaction['implementation']}
  }}

"""
        
        page_object += "}\n"
        return page_object
    
    def get_page_object_name(self, want: str) -> str:
        """Generate page object class name from user story"""
        # Convert "want" statement to PascalCase
        words = re.findall(r'\b\w+', want)
        return ''.join(word.capitalize() for word in words[:3]) + 'Page'
    
    def extract_interactions(self, story: Dict[str, Any]) -> List[Dict[str, str]]:
        """Extract user interactions from acceptance criteria"""
        interactions = []
        
        # Common interaction patterns
        interaction_patterns = {
            r'click (.+?)': 'click{param}',
            r'fill (.+?) with (.+?)': 'fill{param1}',
            r'select (.+?)': 'select{param}',
            r'enter (.+?)': 'enter{param}',
            r'upload (.+?)': 'upload{param}',
            r'submit (.+?)': 'submit{param}'
        }
        
        for criteria in story['acceptance_criteria']:
            for pattern, method_template in interaction_patterns.items():
                matches = re.findall(pattern, criteria.lower())
                if matches:
                    if isinstance(matches[0], tuple):
                        param = matches[0][0]
                    else:
                        param = matches[0]
                    
                    method_name = method_template.format(param=param.replace(' ', '').title())
                    
                    interactions.append({
                        'method': method_name,
                        'params': 'value: string',
                        'implementation': f'await this.page.fill(\'[data-testid="{param.replace(" ", "-")}"]\', value);'
                    })
        
        return interactions
    
    def generate_test_actions(self, scenario: Dict[str, Any]) -> str:
        """Generate test action code from scenario steps"""
        actions = ""
        
        for step in scenario['steps']:
            if 'click' in step.lower():
                actions += "    await page.click('[data-testid=\"action-button\"]');\n"
            elif 'fill' in step.lower() or 'enter' in step.lower():
                actions += "    await page.fill('[data-testid=\"input-field\"]', 'test value');\n"
            elif 'select' in step.lower():
                actions += "    await page.selectOption('[data-testid=\"dropdown\"]', 'option');\n"
            elif 'navigate' in step.lower() or 'go to' in step.lower():
                actions += "    await page.goto('/page');\n"
            else:
                actions += f"    // TODO: Implement step - {step}\n"
        
        return actions
    
    def create_test_config(self, output_dir: str) -> str:
        """Create Playwright configuration file"""
        config_content = """import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
  },
});
"""
        return config_content
    
    def generate_all_tests(self, prd_content: str, output_dir: str = 'tests') -> Dict[str, Any]:
        """Generate complete test suite from PRD"""
        # Parse acceptance criteria
        stories = self.parse_acceptance_criteria(prd_content)
        
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        os.makedirs(f'{output_dir}/pages', exist_ok=True)
        
        # Generate test files
        generated_files = []
        
        for story in stories:
            story_id = story['id']
            
            # Generate different types of tests
            for test_type in ['e2e', 'api', 'visual', 'performance']:
                if any(s['test_type'] == test_type for s in story['test_scenarios']):
                    test_content = self.test_templates[test_type](story)
                    test_file = f"{output_dir}/{story_id}-{test_type}.spec.ts"
                    
                    with open(test_file, 'w') as f:
                        f.write(test_content)
                    
                    generated_files.append(test_file)
            
            # Generate page object
            page_object_content = self.generate_page_object(story)
            page_object_file = f"{output_dir}/pages/{self.get_page_object_name(story['want'])}.ts"
            
            with open(page_object_file, 'w') as f:
                f.write(page_object_content)
            
            generated_files.append(page_object_file)
        
        # Generate Playwright config
        config_content = self.create_test_config(output_dir)
        config_file = 'playwright.config.ts'
        
        with open(config_file, 'w') as f:
            f.write(config_content)
        
        generated_files.append(config_file)
        
        # Generate test summary
        summary = {
            'total_stories': len(stories),
            'total_test_files': len([f for f in generated_files if '.spec.ts' in f]),
            'test_types': list(set(s['test_type'] for story in stories for s in story['test_scenarios'])),
            'generated_files': generated_files
        }
        
        return summary

def main():
    parser = argparse.ArgumentParser(description='Generate Playwright tests from PRD')
    parser.add_argument('prd_file', help='Path to PRD file')
    parser.add_argument('--output', '-o', default='tests', help='Output directory for tests')
    parser.add_argument('--config', action='store_true', help='Generate Playwright config only')
    
    args = parser.parse_args()
    
    generator = PlaywrightTestGenerator()
    
    if args.config:
        # Generate config file only
        config_content = generator.create_test_config(args.output)
        with open('playwright.config.ts', 'w') as f:
            f.write(config_content)
        print("Generated playwright.config.ts")
        return 0
    
    # Read PRD content
    try:
        with open(args.prd_file, 'r') as f:
            prd_content = f.read()
    except FileNotFoundError:
        print(f"Error: PRD file '{args.prd_file}' not found")
        return 1
    
    # Generate tests
    summary = generator.generate_all_tests(prd_content, args.output)
    
    # Print summary
    print(f"✅ Generated tests for {summary['total_stories']} user stories")
    print(f"✅ Created {summary['total_test_files']} test files")
    print(f"✅ Test types: {', '.join(summary['test_types'])}")
    print(f"✅ Output directory: {args.output}")
    print("\nGenerated files:")
    for file_path in summary['generated_files']:
        print(f"  - {file_path}")
    
    print("\nNext steps:")
    print("1. Install Playwright: npm init playwright@latest")
    print("2. Run tests: npx playwright test")
    print("3. View report: npx playwright show-report")
    
    return 0

if __name__ == '__main__':
    exit(main())