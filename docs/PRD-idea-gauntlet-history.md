# PRD: Idea Gauntlet History

**Status:** 🟡 In Progress  
**Created:** 2026-02-06  
**Author:** Sashi

## Overview

Add a persistent history view to Idea Gauntlet that stores and displays all previously evaluated ideas, allowing users to revisit past verdicts, compare ideas over time, and track their ideation patterns.

## Problem Statement

Currently, Idea Gauntlet is ephemeral—once you navigate away or run a new idea, the previous results are lost. Users have to manually export to markdown to preserve results. There's no way to:
- See patterns in your thinking
- Revisit and re-evaluate old ideas
- Compare multiple ideas side-by-side
- Track how your ideas evolve

## User Stories

1. As a user, I want to see a list of all my past ideas so I can revisit them later
2. As a user, I want to quickly see the verdict (GO/PAUSE/KILL) for each past idea
3. As a user, I want to click into a past idea to see the full gauntlet results
4. As a user, I want to delete ideas I no longer care about
5. As a user, I want to re-run an old idea through the gauntlet to get fresh analysis

## Solution

### UX Flow

1. User navigates to `/tools/idea-gauntlet`
2. **New state:** Landing page shows history list (if ideas exist) OR empty state prompting first idea
3. User can click "New Idea" button to enter the gauntlet flow
4. After running gauntlet, results are auto-saved to history
5. User returns to history view, sees new idea at top
6. Clicking any idea expands/navigates to full results

### UI Components

#### History List View (Default)
```
┌─────────────────────────────────────────────────────────┐
│  Idea Gauntlet                                          │
│  Stress test your ideas. No sugarcoating.               │
│                                                         │
│  [+ New Idea]                                    [Sort ▾]│
│                                                         │
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🟢 GO  │ Subscription vitamin packs based on...     ││
│  │        │ Feb 6, 2026 · 87% confidence               ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │ 💀 KILL│ AI-powered lawn care scheduling...         ││
│  │        │ Feb 4, 2026 · 92% confidence               ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │ 🟡 PAUSE│ Chrome extension for website comments...  ││
│  │         │ Feb 6, 2026 · 68% confidence              ││
│  └─────────────────────────────────────────────────────┘│
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### Idea Card States
- **GO:** Green accent/badge
- **PAUSE:** Yellow/amber accent/badge  
- **KILL:** Red accent/badge with skull icon

#### Empty State
```
┌─────────────────────────────────────────────────────────┐
│                         💀                              │
│                                                         │
│              No ideas tested yet                        │
│      Your graveyard (and victories) will appear here    │
│                                                         │
│                   [Test Your First Idea]                │
└─────────────────────────────────────────────────────────┘
```

#### Idea Detail View
- Same as current results view
- Add "Back to History" navigation
- Add "Delete" action in header
- Add "Re-run Gauntlet" action

### API Requirements

#### Database Schema
```sql
CREATE TABLE idea_gauntlet_runs (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  result JSON NOT NULL,  -- Full GauntletResult object
  verdict TEXT NOT NULL, -- 'GO' | 'PAUSE' | 'KILL'
  confidence INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

#### Endpoints

**GET /api/tools/idea-gauntlet**
```json
{
  "runs": [
    {
      "id": "abc123",
      "idea": "Subscription vitamin packs...",
      "verdict": "GO",
      "confidence": 87,
      "createdAt": "2026-02-06T21:00:00Z"
    }
  ]
}
```

**GET /api/tools/idea-gauntlet/[id]**
Returns full result object for a specific run.

**POST /api/tools/idea-gauntlet** (existing, modify)
- Save result to database after generation
- Return `id` in response

**DELETE /api/tools/idea-gauntlet/[id]**
Soft delete or hard delete a run.

## Technical Implementation

### Phase 1: Database & API
- [ ] Add `idea_gauntlet_runs` table to schema
- [ ] Run Turso migration
- [ ] Modify POST endpoint to save results
- [ ] Add GET endpoint for history list
- [ ] Add GET endpoint for single run
- [ ] Add DELETE endpoint

### Phase 2: History UI
- [ ] Create history list component
- [ ] Create idea card component with verdict badge
- [ ] Create empty state component
- [ ] Add "New Idea" button routing
- [ ] Implement sort dropdown (newest/oldest/verdict)

### Phase 3: Detail View Updates
- [ ] Add back navigation to results view
- [ ] Add delete action with confirmation
- [ ] Add re-run action
- [ ] Load from database instead of local state when viewing history item

## Acceptance Criteria

- [ ] Running an idea automatically saves to history
- [ ] History persists across sessions/page refreshes
- [ ] Can view full results of any past idea
- [ ] Can delete unwanted ideas
- [ ] Can re-run an idea to get fresh analysis
- [ ] Verdict badges clearly distinguish GO/PAUSE/KILL
- [ ] Empty state shown when no history exists
- [ ] History sorted by newest first by default

## Test Scenarios

```gherkin
Feature: Idea Gauntlet History

Scenario: First-time user sees empty state
  Given I have never run an idea through the gauntlet
  When I navigate to /tools/idea-gauntlet
  Then I see the empty state with "Test Your First Idea" button

Scenario: Running idea saves to history
  Given I am on the new idea form
  When I enter "AI lawn care" and click "Run the Gauntlet"
  And the analysis completes with verdict "KILL"
  Then the result is saved to the database
  And I can navigate back to see it in history

Scenario: Viewing past idea
  Given I have 3 ideas in my history
  When I click on the second idea card
  Then I see the full gauntlet results for that idea
  And I see a "Back to History" link

Scenario: Deleting an idea
  Given I am viewing a past idea's results
  When I click "Delete" and confirm
  Then the idea is removed from history
  And I am returned to the history list

Scenario: Re-running an idea
  Given I am viewing a past idea's results
  When I click "Re-run Gauntlet"
  Then a new analysis runs with the same idea text
  And a new entry is added to history (original preserved)
```

## Design Specifications

### Colors
- GO badge: `bg-green-500/10 text-green-400 border-green-500/30`
- PAUSE badge: `bg-yellow-500/10 text-yellow-400 border-yellow-500/30`
- KILL badge: `bg-red-500/10 text-red-400 border-red-500/30`

### Typography
- Idea preview: `text-sm text-[var(--text-secondary)]` truncated to 2 lines
- Date: `text-xs text-[var(--text-quaternary)]`
- Confidence: `text-xs text-[var(--text-tertiary)]`

### Spacing
- Card padding: `p-4`
- Card gap: `gap-3` (12px)
- Verdict badge: `px-2 py-1 rounded text-xs font-medium`

### Animations
- Card hover: `hover:bg-[var(--bg-hover)] transition-colors`
- Delete confirmation: Use existing dialog pattern

## Out of Scope

- Search/filter by keyword (can add later)
- Tagging or categorizing ideas
- Sharing ideas with others
- Comparing two ideas side-by-side (v2 feature)
- Analytics/stats dashboard ("you've killed 80% of your ideas")

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Large result JSON bloats database | Store full result as compressed JSON, only fetch on detail view |
| User accidentally deletes important idea | Add confirmation dialog, consider soft delete with 30-day recovery |
| API costs if users spam re-runs | Rate limit or add cooldown on re-run button |
