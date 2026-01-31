# CAST Skills Library 🏗️

*Command-based workflow skills for enhanced productivity*

## Current Available Skills

### 🎨 Frontend Design
**Command:** Built-in skill (auto-triggers)  
**Description:** Create distinctive, production-grade frontend interfaces with high design quality  
**Usage:** Ask to build web components, pages, or applications  
**Location:** `/Users/sashi/clawd/skills/frontend-design/`

### 🎬 Remotion Video Creation  
**Command:** Built-in skill (auto-triggers)  
**Description:** Create animated video clips from designs using Remotion (React-based video framework)  
**Usage:** For social media posts, design showcases, and UI animations  
**Location:** `/Users/sashi/clawd/skills/remotion/`

## Planned CAST Workflow Commands

*These are the workflow protocols we designed for feature development*

### ⚡ CAST: CREATE_PRD
**Purpose:** Generate comprehensive Product Requirements Documents  
**Trigger:** `CAST: CREATE_PRD [feature name]`  
**Workflow:** 
- Stakeholder analysis
- User stories & acceptance criteria  
- Technical requirements
- Success metrics
- **Status:** 📋 Planned (not yet implemented)

### 🎯 CAST: GENERATE_TASKS
**Purpose:** Break down PRDs into actionable development tasks  
**Trigger:** `CAST: GENERATE_TASKS`  
**Workflow:**
- Parse PRD into discrete tasks
- Estimate effort & dependencies  
- Create GitHub issues
- Assign priorities
- **Status:** 📋 Planned (not yet implemented)

### 🌿 CAST: SETUP_BRANCH
**Purpose:** Initialize feature branch with proper structure  
**Trigger:** `CAST: SETUP_BRANCH [feature-name]`  
**Workflow:**
- Create feature branch
- Set up project structure
- Initialize tests & CI
- **Status:** 📋 Planned (not yet implemented)

### 🧪 CAST: GENERATE_TESTS
**Purpose:** Generate Playwright tests from PRD acceptance criteria  
**Trigger:** `CAST: GENERATE_TESTS`  
**Workflow:**
- Parse acceptance criteria  
- Generate E2E test specs
- Set up test data
- **Status:** 📋 Planned (not yet implemented)

### ⚔️ CAST: IMPLEMENT_FEATURE  
**Purpose:** Parallel backend + frontend development  
**Trigger:** `CAST: IMPLEMENT_FEATURE`  
**Workflow:**
- Spawn coding agents
- Backend API development
- Frontend implementation  
- Integration testing
- **Status:** 📋 Planned (not yet implemented)

### 🛡️ CAST: VALIDATE_DEPLOY
**Purpose:** QA validation and production deployment  
**Trigger:** `CAST: VALIDATE_DEPLOY`  
**Workflow:**
- Run full test suite
- Playwright visual regression  
- Performance validation
- Deploy to production
- **Status:** 📋 Planned (not yet implemented)

## How to Make Skills Available Across All Channels

### Option 1: Package & Distribute Skills 📦

1. **Package existing skills:**
   ```bash
   cd ~/clawd
   scripts/package_skill.py skills/frontend-design
   scripts/package_skill.py skills/remotion
   ```

2. **Install in Clawdbot:**
   ```bash
   # Copy to Clawdbot skills directory
   cp frontend-design.skill /opt/homebrew/lib/node_modules/clawdbot/skills/
   cp remotion.skill /opt/homebrew/lib/node_modules/clawdbot/skills/
   ```

3. **Restart Clawdbot to load new skills:**
   ```bash
   clawdbot gateway restart
   ```

### Option 2: Global Skills Directory 🌍

Create a shared skills location that all channels can access:

1. **Set up global skills directory:**
   ```bash
   mkdir -p ~/clawd/global-skills
   ```

2. **Move skills to global location:**
   ```bash
   mv ~/clawd/skills/* ~/clawd/global-skills/
   ```

3. **Configure Clawdbot to load from global directory** (update config)

### Option 3: Skill Commands Documentation 📚

For the CAST commands, create a shared reference document that any agent can read:

1. **Create in workspace:** `~/clawd/WORKFLOW-COMMANDS.md`
2. **Include in agent instructions:** Reference this file for workflow protocols
3. **Update across channels:** Copy to each channel's context

## Implementation Status

- ✅ **Frontend Design:** Active skill, auto-triggers
- ✅ **Remotion:** Active skill, auto-triggers  
- 📋 **CAST Workflows:** Designed but not implemented as formal skills
- 🎯 **Next Step:** Convert CAST workflows into packaged skills

## Creating the Missing CAST Skills

To implement the planned workflow commands:

1. **Use skill-creator to initialize:**
   ```bash
   scripts/init_skill.py create-prd --path ~/clawd/global-skills
   scripts/init_skill.py generate-tasks --path ~/clawd/global-skills  
   # etc.
   ```

2. **Implement each workflow in SKILL.md**
3. **Package and distribute** using the process above

---

**💡 Recommendation:** Start with implementing **CAST: CREATE_PRD** as it's the foundation for the other workflow commands.