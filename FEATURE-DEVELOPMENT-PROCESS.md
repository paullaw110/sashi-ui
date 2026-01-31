# Feature Development Process

**Complete workflow from idea to production with automated testing and quality gates.**

---

## **Overview**

This process ensures every feature is properly planned, tested, and deployed with minimal manual intervention while maintaining high quality standards.

### **Process Flow:**
1. **Planning** → PRD with test scenarios
2. **Task Breakdown** → Actionable tasks + test plan
3. **Git Setup** → Feature branch + draft PR
4. **Test Creation** → Playwright tests from acceptance criteria
5. **Implementation** → Coding agents with continuous validation
6. **Deployment** → Full test suite + production deploy

---

## **Command Structure**

### **How to Cast Skills:**
Use the format: `CAST: SKILL_NAME` followed by any required context.

**Examples:**
- `CAST: CREATE_PRD` - user dashboard with settings panel
- `CAST: GENERATE_TASKS` 
- `CAST: SETUP_BRANCH` - feature/user-dashboard
- `CAST: GENERATE_TESTS`
- `CAST: IMPLEMENT_FEATURE`
- `CAST: VALIDATE_DEPLOY`

### **Skill Chaining:**
Skills are designed to chain together smoothly:
```
You: "CAST: CREATE_PRD - user dashboard feature"  
Me: *generates PRD with clarifying questions*
You: "1A, 2C, 3B"
Me: *completes PRD*
You: "CAST: GENERATE_TASKS"
Me: *breaks down into actionable tasks*
You: "CAST: IMPLEMENT_FEATURE" 
Me: *unleashes coding agents in parallel*
```

---

## **Phase 1: Requirements & Planning**

### **Step 1.1: Create PRD**
**Command:** `CAST: CREATE_PRD` ⚡
**Output:** `/tasks/prd-[feature-name].md`

**Process:**
1. Receive feature request from stakeholder
2. AI asks clarifying questions with A/B/C options
3. Generate comprehensive PRD including:
   - Goals and user stories
   - Functional requirements (numbered)
   - **Acceptance criteria** (for test generation)
   - Non-goals (scope boundaries)
   - Success metrics

**Enhanced Requirements:**
- Each functional requirement must have testable acceptance criteria
- Include API endpoints if backend work required
- Specify UI components and user interactions
- Define error states and edge cases

### **Step 1.2: Generate Task Breakdown**
**Command:** `CAST: GENERATE_TASKS` 🎯
**Output:** `/tasks/tasks-[feature-name].md`

**Process:**
1. Parse PRD functional requirements
2. Break down into atomic, implementable tasks
3. Add testing tasks for each functional requirement
4. Estimate complexity (S/M/L)
5. Define task dependencies

**Task Categories:**
- **Backend:** API endpoints, data models, business logic
- **Frontend:** Components, pages, integrations
- **Testing:** Unit, integration, E2E scenarios
- **DevOps:** Environment setup, CI/CD updates

---

## **Phase 2: Development Setup**

### **Step 2.1: Git Workflow Setup**
**Command:** `CAST: SETUP_BRANCH` 🌿
**Dependencies:** `github` skill

**Process:**
```bash
# 1. Create feature branch from main
git checkout main && git pull
git checkout -b feature/[feature-name]

# 2. Create draft PR for tracking
gh pr create --draft \
  --title "Feature: [Feature Name]" \
  --body "$(cat /tasks/prd-[feature-name].md)" \
  --repo paullaw110/impaclabs

# 3. Set up project board tracking
gh issue create --title "[Feature Name] - Epic" \
  --body "Track implementation of [feature-name]" \
  --repo paullaw110/impaclabs
```

### **Step 2.2: Generate Test Suite**
**Command:** `CAST: GENERATE_TESTS` 🧪
**Dependencies:** Playwright setup

**Process:**
1. Parse PRD acceptance criteria
2. Generate Playwright test files:
   - `tests/features/[feature-name].spec.ts`
   - `tests/api/[feature-name]-api.spec.ts` (if backend)
3. Create test data fixtures
4. Set up visual regression baselines

**Test Structure:**
```typescript
// tests/features/user-settings.spec.ts
test.describe('User Settings Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup common to all tests
  });

  test('should allow profile picture upload', async ({ page }) => {
    // From PRD: "User can upload profile picture"
    // Test implementation with assertions
  });

  test('should validate password strength requirements', async ({ page }) => {
    // From PRD: "Password must meet complexity requirements"
    // Test various password scenarios
  });

  test('should save settings and persist on reload', async ({ page }) => {
    // From PRD: "Settings persist across sessions"
    // Test data persistence
  });
});
```

---

## **Phase 3: Implementation**

### **Step 3.1: Parallel Development**
**Command:** `CAST: IMPLEMENT_FEATURE` ⚔️
**Dependencies:** `coding-agent` skill

**Process:**
1. Create git worktrees for parallel development:
   ```bash
   git worktree add /tmp/backend-work feature/[feature-name]
   git worktree add /tmp/frontend-work feature/[feature-name]
   ```

2. Launch coding agents in background:
   ```bash
   # Backend implementation
   bash pty:true workdir:/tmp/backend-work background:true \
     command:"codex --full-auto 'Implement backend tasks from /tasks/tasks-[feature-name].md. Run tests after each endpoint.'"

   # Frontend implementation  
   bash pty:true workdir:/tmp/frontend-work background:true \
     command:"codex --full-auto 'Implement frontend tasks from /tasks/tasks-[feature-name].md. Test components as you build.'"
   ```

3. Monitor progress:
   ```bash
   process action:list
   process action:log sessionId:XXX
   ```

### **Step 3.2: Continuous Validation**
**During Implementation:**

1. **Unit Tests:** Run after each component/function
2. **Integration Tests:** Run after API endpoint completion
3. **Playwright Tests:** Run after major milestones
4. **Visual Regression:** Capture screenshots for UI changes

**Auto-commit Strategy:**
```bash
# Coding agents commit with descriptive messages
git add -A
git commit -m "feat: implement user profile upload API

- Add /api/profile/upload endpoint
- Handle file validation and storage
- Add unit tests for upload logic
- Tests passing: 15/15"

git push origin feature/[feature-name]
```

---

## **Phase 4: Quality Assurance**

### **Step 4.1: Full Test Suite Execution**
**Command:** `CAST: VALIDATE_DEPLOY` 🛡️

**Pre-Deploy Checklist:**
```bash
# 1. Run complete test suite
npm run test:unit
npm run test:integration
npx playwright test

# 2. Visual regression check
npx playwright test --update-snapshots
# Review visual diffs manually

# 3. Performance validation
npm run test:performance

# 4. Accessibility audit
npx playwright test tests/accessibility/

# 5. Cross-browser testing
npx playwright test --project=chromium,firefox,webkit
```

### **Step 4.2: Code Quality Gates**

1. **ESLint/Prettier:** Code formatting
2. **TypeScript:** Type safety validation
3. **Bundle Analysis:** Performance impact check
4. **Security Scan:** Dependency vulnerabilities

---

## **Phase 5: Deployment**

### **Step 5.1: Production Deploy**
**Prerequisites:** All tests passing ✅

**Process:**
1. **Staging Deploy:**
   ```bash
   # Deploy to staging environment
   vercel deploy --prod=false
   
   # Run smoke tests against staging
   PLAYWRIGHT_BASE_URL=https://staging.impaclabs.com npx playwright test tests/smoke/
   ```

2. **Production Deploy:**
   ```bash
   # Deploy to production
   vercel deploy --prod
   
   # Run post-deploy validation
   PLAYWRIGHT_BASE_URL=https://impaclabs.com npx playwright test tests/smoke/
   ```

3. **Post-Deploy Monitoring:**
   - Error rate monitoring
   - Performance metrics
   - User engagement tracking

### **Step 5.2: PR Review & Merge**
```bash
# Mark PR as ready for review
gh pr ready

# Request reviews
gh pr edit --add-reviewer team-lead,qa-engineer

# Auto-merge after approvals (if CI passes)
gh pr merge --squash --auto
```

---

## **Automation Tools & Skills**

### **Required Clawdbot Skills:**
1. **`coding-agent`** - Core development automation
2. **`github`** - Git workflow management
3. **`notion`** - Task tracking integration
4. **`skill-creator`** - Custom workflow tools

### **New Skills to Create:**
1. **`CAST: SETUP_BRANCH`** 🌿 - Git + GitHub automation
2. **`CAST: GENERATE_TESTS`** 🧪 - Test generation from PRD
3. **`CAST: IMPLEMENT_FEATURE`** ⚔️ - Coding agent orchestration
4. **`CAST: VALIDATE_DEPLOY`** 🛡️ - Quality gates + deployment

### **Development Tools:**
- **Testing:** Playwright, Jest, Vitest
- **Code Quality:** ESLint, Prettier, TypeScript
- **CI/CD:** GitHub Actions, Vercel
- **Monitoring:** Error tracking, performance metrics

---

## **Quality Gates Summary**

| Phase | Gate | Tool | Pass Criteria |
|-------|------|------|---------------|
| Planning | PRD Complete | Human Review | Stakeholder approval |
| Setup | Tests Generated | Playwright | All scenarios covered |
| Implementation | Unit Tests | Jest/Vitest | 100% pass rate |
| Implementation | Integration Tests | Custom | API contracts validated |
| Pre-Deploy | E2E Tests | Playwright | User journeys working |
| Pre-Deploy | Visual Regression | Playwright | No unexpected UI changes |
| Pre-Deploy | Performance | Lighthouse | No degradation |
| Post-Deploy | Smoke Tests | Playwright | Core features functional |

---

## **Success Metrics**

### **Development Velocity:**
- Time from PRD → Production: Target < 1 week
- Feature defect rate: Target < 5%
- Test coverage: Target > 90%

### **Quality Metrics:**
- Post-deploy bugs: Target < 1 per feature
- User satisfaction: Track via feature usage
- Performance impact: No regression in Core Web Vitals

---

## **Emergency Procedures**

### **Rollback Process:**
1. Immediate revert via Vercel dashboard
2. Run smoke tests on previous version
3. Create hotfix branch for urgent fixes
4. Fast-track through abbreviated process

### **Hotfix Workflow:**
1. Create hotfix branch from production
2. Minimal fix with focused tests
3. Skip full test suite (run critical path only)
4. Deploy with monitoring alerts active

---

*This process evolves with each feature. Update this document as we learn and improve.*