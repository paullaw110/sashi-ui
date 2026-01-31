#!/usr/bin/env python3
"""
Create and setup feature branches with proper structure
"""
import subprocess
import os
import argparse
import json
from typing import Dict, List, Any

class BranchCreator:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        
    def check_git_repo(self) -> bool:
        """Check if current directory is a Git repository"""
        try:
            result = subprocess.run(['git', 'rev-parse', '--git-dir'], 
                                  capture_output=True, text=True)
            return result.returncode == 0
        except FileNotFoundError:
            print("Error: Git not found. Please install Git first.")
            return False
    
    def get_current_branch(self) -> str:
        """Get the current Git branch name"""
        try:
            result = subprocess.run(['git', 'branch', '--show-current'], 
                                  capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
            return "main"  # fallback
        except Exception:
            return "main"
    
    def normalize_branch_name(self, feature_name: str, issue_number: str = None, branch_type: str = "feature") -> str:
        """Create a normalized branch name"""
        # Clean feature name
        clean_name = feature_name.lower().replace(' ', '-').replace('_', '-')
        clean_name = ''.join(c for c in clean_name if c.isalnum() or c == '-')
        
        if issue_number:
            return f"{branch_type}/{issue_number}-{clean_name}"
        else:
            return f"{branch_type}/{clean_name}"
    
    def create_git_branch(self, branch_name: str, base_branch: str = None) -> bool:
        """Create a new Git branch"""
        if not base_branch:
            base_branch = self.get_current_branch()
        
        commands = [
            ['git', 'checkout', base_branch],
            ['git', 'pull', 'origin', base_branch],
            ['git', 'checkout', '-b', branch_name]
        ]
        
        for cmd in commands:
            if self.dry_run:
                print(f"[DRY RUN] Would run: {' '.join(cmd)}")
                continue
                
            try:
                result = subprocess.run(cmd, capture_output=True, text=True)
                if result.returncode != 0:
                    print(f"Error running {' '.join(cmd)}: {result.stderr}")
                    return False
            except Exception as e:
                print(f"Error running {' '.join(cmd)}: {e}")
                return False
        
        print(f"Created branch: {branch_name}")
        return True
    
    def create_directory_structure(self, project_type: str, base_path: str = ".") -> bool:
        """Create project directory structure based on type"""
        structures = {
            'fullstack': [
                'frontend/src/components',
                'frontend/src/pages',
                'frontend/src/services',
                'frontend/src/utils',
                'frontend/src/styles',
                'frontend/tests/unit',
                'frontend/tests/integration',
                'frontend/tests/e2e',
                'frontend/public',
                'backend/src/controllers',
                'backend/src/models',
                'backend/src/routes',
                'backend/src/middleware',
                'backend/src/services',
                'backend/tests/unit',
                'backend/tests/integration',
                'backend/tests/api',
                'database/migrations',
                'database/seeds',
                'database/schema',
                'docs/api',
                'docs/features',
                'scripts',
                '.github/workflows'
            ],
            'frontend': [
                'src/components',
                'src/pages',
                'src/hooks',
                'src/services',
                'src/utils',
                'src/styles',
                'tests/unit',
                'tests/integration',
                'tests/e2e',
                'public',
                'docs',
                '.github/workflows'
            ],
            'backend': [
                'src/controllers',
                'src/models',
                'src/routes',
                'src/middleware',
                'src/services',
                'src/utils',
                'tests/unit',
                'tests/integration',
                'tests/api',
                'database/migrations',
                'database/seeds',
                'docs/api',
                'scripts',
                '.github/workflows'
            ]
        }
        
        directories = structures.get(project_type, structures['fullstack'])
        
        for directory in directories:
            full_path = os.path.join(base_path, directory)
            
            if self.dry_run:
                print(f"[DRY RUN] Would create directory: {full_path}")
                continue
            
            try:
                os.makedirs(full_path, exist_ok=True)
                # Create .gitkeep for empty directories
                gitkeep_path = os.path.join(full_path, '.gitkeep')
                if not os.listdir(full_path):
                    with open(gitkeep_path, 'w') as f:
                        f.write('')
            except Exception as e:
                print(f"Error creating directory {full_path}: {e}")
                return False
        
        print(f"Created {project_type} directory structure")
        return True
    
    def create_package_json(self, project_type: str, feature_name: str, directory: str) -> bool:
        """Create package.json files for Node.js projects"""
        package_configs = {
            'frontend': {
                'name': f"{feature_name}-frontend",
                'version': '0.1.0',
                'private': True,
                'scripts': {
                    'dev': 'next dev',
                    'build': 'next build',
                    'start': 'next start',
                    'lint': 'next lint',
                    'test': 'jest',
                    'test:watch': 'jest --watch',
                    'test:e2e': 'playwright test'
                },
                'dependencies': {
                    'next': '^14.0.0',
                    'react': '^18.0.0',
                    'react-dom': '^18.0.0'
                },
                'devDependencies': {
                    '@types/node': '^18.0.0',
                    '@types/react': '^18.0.0',
                    '@types/react-dom': '^18.0.0',
                    'eslint': '^8.0.0',
                    'eslint-config-next': '^14.0.0',
                    'jest': '^29.0.0',
                    'playwright': '^1.40.0',
                    'typescript': '^5.0.0'
                }
            },
            'backend': {
                'name': f"{feature_name}-backend",
                'version': '0.1.0',
                'private': True,
                'scripts': {
                    'dev': 'nodemon src/index.ts',
                    'build': 'tsc',
                    'start': 'node dist/index.js',
                    'test': 'jest',
                    'test:watch': 'jest --watch',
                    'lint': 'eslint src --ext .ts',
                    'migrate': 'knex migrate:latest',
                    'seed': 'knex seed:run'
                },
                'dependencies': {
                    'express': '^4.18.0',
                    'cors': '^2.8.0',
                    'helmet': '^7.0.0',
                    'morgan': '^1.10.0'
                },
                'devDependencies': {
                    '@types/express': '^4.17.0',
                    '@types/cors': '^2.8.0',
                    '@types/morgan': '^1.9.0',
                    '@types/node': '^18.0.0',
                    '@types/jest': '^29.0.0',
                    'eslint': '^8.0.0',
                    'jest': '^29.0.0',
                    'nodemon': '^3.0.0',
                    'ts-node': '^10.9.0',
                    'typescript': '^5.0.0'
                }
            }
        }
        
        config = package_configs.get(project_type)
        if not config:
            return True  # Skip if no config for this type
        
        package_path = os.path.join(directory, 'package.json')
        
        if self.dry_run:
            print(f"[DRY RUN] Would create: {package_path}")
            return True
        
        try:
            with open(package_path, 'w') as f:
                json.dump(config, f, indent=2)
            print(f"Created package.json at {package_path}")
            return True
        except Exception as e:
            print(f"Error creating package.json: {e}")
            return False
    
    def create_boilerplate_files(self, project_type: str, feature_name: str) -> bool:
        """Create initial boilerplate files"""
        if project_type in ['frontend', 'fullstack']:
            self.create_frontend_boilerplate(feature_name)
        
        if project_type in ['backend', 'fullstack']:
            self.create_backend_boilerplate(feature_name)
        
        self.create_github_workflows(project_type)
        self.create_documentation_templates(feature_name)
        
        return True
    
    def create_frontend_boilerplate(self, feature_name: str) -> bool:
        """Create frontend boilerplate files"""
        frontend_dir = 'frontend' if os.path.exists('frontend') else 'src'
        
        # Next.js config
        nextjs_config = """/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
"""
        
        # Main page component
        main_page = f"""import React from 'react';

export default function {feature_name.replace('-', '').title()}Page() {{
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-4">{feature_name.replace('-', ' ').title()}</h1>
      <p>Welcome to the {feature_name} feature.</p>
    </div>
  );
}}
"""
        
        files_to_create = [
            ('next.config.js', nextjs_config),
            (f'{frontend_dir}/src/app/page.tsx', main_page),
            (f'{frontend_dir}/src/app/layout.tsx', self.get_layout_template()),
            (f'{frontend_dir}/src/app/globals.css', self.get_css_template()),
        ]
        
        for file_path, content in files_to_create:
            self.create_file(file_path, content)
        
        return True
    
    def create_backend_boilerplate(self, feature_name: str) -> bool:
        """Create backend boilerplate files"""
        backend_dir = 'backend' if os.path.exists('backend') else 'src'
        
        # Express app setup
        app_content = """import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
"""
        
        files_to_create = [
            (f'{backend_dir}/src/index.ts', app_content),
            (f'{backend_dir}/tsconfig.json', self.get_tsconfig_template()),
            (f'{backend_dir}/.env.example', self.get_env_template()),
        ]
        
        for file_path, content in files_to_create:
            self.create_file(file_path, content)
        
        return True
    
    def create_github_workflows(self, project_type: str) -> bool:
        """Create GitHub Actions workflow files"""
        workflow_content = f"""name: {project_type.title()} CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Use Node.js ${{{{ matrix.node-version }}}}
      uses: actions/setup-node@v4
      with:
        node-version: ${{{{ matrix.node-version }}}}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Run linting
      run: npm run lint
    
    - name: Build
      run: npm run build
"""
        
        self.create_file('.github/workflows/ci.yml', workflow_content)
        return True
    
    def create_documentation_templates(self, feature_name: str) -> bool:
        """Create documentation template files"""
        readme_content = f"""# {feature_name.replace('-', ' ').title()}

## Overview
Brief description of the {feature_name} feature.

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
npm install
```

### Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

## Architecture
Describe the architecture and design decisions.

## API Documentation
Link to API documentation or describe endpoints here.

## Contributing
Guidelines for contributing to this feature.
"""
        
        api_docs = f"""# API Documentation

## Base URL
`http://localhost:3001/api`

## Authentication
Describe authentication requirements.

## Endpoints

### GET /health
Health check endpoint.

**Response:**
```json
{{
  "status": "ok",
  "timestamp": "2024-01-30T10:00:00Z"
}}
```

## Error Handling
Describe error response format and common error codes.
"""
        
        files_to_create = [
            ('README.md', readme_content),
            ('docs/api.md', api_docs),
            ('docs/CONTRIBUTING.md', self.get_contributing_template()),
        ]
        
        for file_path, content in files_to_create:
            self.create_file(file_path, content)
        
        return True
    
    def create_file(self, file_path: str, content: str) -> bool:
        """Create a file with given content"""
        if self.dry_run:
            print(f"[DRY RUN] Would create file: {file_path}")
            return True
        
        try:
            # Create directory if it doesn't exist
            directory = os.path.dirname(file_path)
            if directory and not os.path.exists(directory):
                os.makedirs(directory, exist_ok=True)
            
            with open(file_path, 'w') as f:
                f.write(content)
            print(f"Created file: {file_path}")
            return True
        except Exception as e:
            print(f"Error creating file {file_path}: {e}")
            return False
    
    def get_layout_template(self) -> str:
        """Get Next.js layout template"""
        return """import './globals.css'

export const metadata = {
  title: 'Feature App',
  description: 'Feature development application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
"""
    
    def get_css_template(self) -> str:
        """Get CSS template"""
        return """@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 0, 0, 0;
  --background-start-rgb: 214, 219, 220;
  --background-end-rgb: 255, 255, 255;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
}
"""
    
    def get_tsconfig_template(self) -> str:
        """Get TypeScript configuration"""
        return """{
  "compilerOptions": {
    "target": "es2018",
    "lib": ["es2018"],
    "module": "commonjs",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
"""
    
    def get_env_template(self) -> str:
        """Get environment variables template"""
        return """# Environment variables
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/database

# API Keys
JWT_SECRET=your-secret-key

# External Services
REDIS_URL=redis://localhost:6379
"""
    
    def get_contributing_template(self) -> str:
        """Get contributing guidelines template"""
        return """# Contributing Guidelines

## Development Workflow

1. Create feature branch from main
2. Make changes and add tests
3. Run tests and linting
4. Submit pull request

## Code Standards

- Use TypeScript for type safety
- Follow ESLint configuration
- Write tests for new features
- Document public APIs

## Commit Messages

Use conventional commit format:
- feat: add new feature
- fix: fix bug
- docs: update documentation
- test: add tests
- refactor: refactor code

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure CI passes
4. Request code review
"""

def main():
    parser = argparse.ArgumentParser(description='Create and setup feature branches')
    parser.add_argument('feature_name', help='Feature name for the branch')
    parser.add_argument('--issue', help='GitHub issue number')
    parser.add_argument('--type', choices=['frontend', 'backend', 'fullstack'], 
                       default='fullstack', help='Project type')
    parser.add_argument('--base-branch', default=None, 
                       help='Base branch to create from (default: current branch)')
    parser.add_argument('--dry-run', action='store_true',
                       help='Show what would be done without actually doing it')
    
    args = parser.parse_args()
    
    creator = BranchCreator(dry_run=args.dry_run)
    
    # Check prerequisites
    if not creator.check_git_repo():
        print("Error: Not in a Git repository")
        return 1
    
    # Create branch name
    branch_name = creator.normalize_branch_name(args.feature_name, args.issue)
    print(f"Creating branch: {branch_name}")
    
    # Create Git branch
    if not creator.create_git_branch(branch_name, args.base_branch):
        return 1
    
    # Create project structure
    if not creator.create_directory_structure(args.type):
        return 1
    
    # Create package.json files
    if args.type in ['frontend', 'fullstack']:
        creator.create_package_json('frontend', args.feature_name, 'frontend' if os.path.exists('frontend') else '.')
    
    if args.type in ['backend', 'fullstack']:
        creator.create_package_json('backend', args.feature_name, 'backend' if os.path.exists('backend') else '.')
    
    # Create boilerplate files
    creator.create_boilerplate_files(args.type, args.feature_name)
    
    print(f"✅ Feature branch '{branch_name}' created successfully!")
    print(f"✅ Project structure for '{args.type}' initialized")
    print("\nNext steps:")
    print("1. Install dependencies: npm install")
    print("2. Start development server: npm run dev")
    print("3. Run tests: npm test")
    
    return 0

if __name__ == '__main__':
    exit(main())