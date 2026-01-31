# PRD: Sashi Design System Implementation

> **Status:** Ready for Implementation  
> **Created:** 2026-01-30  
> **Source:** design-forensics analysis by Mu  
> **Target:** sashi-ui (Next.js + Tailwind + shadcn/ui)

---

## Executive Summary

Apply a cohesive dark-theme design system to sashi-ui based on Mu's forensic analysis of the Acme Financial Dashboard. The system emphasizes sophisticated dark backgrounds, clear typography hierarchy, warm accent tones, and card-based layouts.

**Key characteristics:** Professional, calm, information-dense without clutter.

---

## 1. Scope

### In Scope
- [ ] Color system update (CSS variables + Tailwind config)
- [ ] Typography system (GT Sectra display + Inter body)
- [ ] Spacing system standardization (4px base)
- [ ] Component styling updates (Cards, Buttons, Inputs, Navigation)
- [ ] Global dark theme refinement

### Out of Scope (Phase 2)
- Charts/data visualization components
- Animation library
- Mobile-specific layouts

---

## 2. Color System

### CSS Variables (globals.css)

Replace existing `:root` / `.dark` variables with:

```css
@layer base {
  :root {
    /* Backgrounds */
    --background: 0 0% 4%;           /* #0A0A0A - page bg */
    --card: 0 0% 8%;                 /* #141414 - card surfaces */
    --popover: 0 0% 8%;
    
    /* Foreground */
    --foreground: 0 0% 100%;         /* #FFFFFF */
    --card-foreground: 0 0% 100%;
    --popover-foreground: 0 0% 100%;
    
    /* Muted */
    --muted: 0 0% 15%;               /* #262626 */
    --muted-foreground: 0 0% 64%;    /* #A3A3A3 */
    
    /* Primary (warm gold accent) */
    --primary: 39 91% 55%;           /* #F5A623 */
    --primary-foreground: 0 0% 4%;
    
    /* Secondary */
    --secondary: 0 0% 15%;
    --secondary-foreground: 0 0% 100%;
    
    /* Accent */
    --accent: 0 0% 15%;
    --accent-foreground: 0 0% 100%;
    
    /* Destructive */
    --destructive: 0 84% 60%;        /* #EF4444 */
    --destructive-foreground: 0 0% 100%;
    
    /* Borders & Inputs */
    --border: 0 0% 15%;              /* #262626 */
    --input: 0 0% 15%;
    --ring: 39 91% 55%;              /* Gold focus ring */
    
    /* Radius */
    --radius: 0.75rem;               /* 12px */
  }
}
```

### Extended Colors (Tailwind)

```js
// tailwind.config.ts - extend colors
colors: {
  surface: {
    DEFAULT: '#141414',
    elevated: '#1A1A1A',
  },
  subtle: {
    DEFAULT: '#737373',              // Labels, timestamps
    faint: '#525252',                // Disabled, placeholders
  },
  accent: {
    gold: '#F5A623',
    pink: '#E879A0',
  },
  success: '#22C55E',
  warning: '#F59E0B',
  info: '#3B82F6',
}
```

---

## 3. Typography

### Fonts

| Purpose | Font | Fallback |
|---------|------|----------|
| Display | GT Sectra | Georgia, serif |
| Body | Inter | system-ui, sans-serif |
| Mono | JetBrains Mono | monospace |

### Font Installation

1. Add GT Sectra files to `/public/fonts/`
2. Define @font-face in globals.css
3. Configure Tailwind fontFamily

```css
/* globals.css */
@font-face {
  font-family: 'GT Sectra';
  src: url('/fonts/GTSectra-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'GT Sectra';
  src: url('/fonts/GTSectra-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}
```

```js
// tailwind.config.ts
fontFamily: {
  display: ['GT Sectra', 'Georgia', 'serif'],
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}
```

### Type Scale

```js
// tailwind.config.ts - extend fontSize
fontSize: {
  'display': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '300' }],
  'display-bold': ['2.25rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '500' }],
  'metric-lg': ['2rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
  'metric-md': ['1.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
  'label': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02em', fontWeight: '500' }],
}
```

### Usage Patterns

| Element | Class |
|---------|-------|
| Page greeting | `font-display text-display` |
| Name emphasis | `font-display text-display-bold` |
| Large metrics | `text-metric-lg font-semibold` |
| Card labels | `text-label text-muted-foreground uppercase` |
| Body text | `text-sm` (14px default) |
| Captions | `text-xs text-subtle` |

---

## 4. Spacing System

**Base unit:** 4px (0.25rem)

### Key Patterns

| Context | Value | Tailwind |
|---------|-------|----------|
| Card padding | 24px | `p-6` |
| Card grid gap | 16px | `gap-4` |
| Section spacing | 32px | `space-y-8` |
| Icon-text gap | 8px | `gap-2` |
| Inline spacing | 4px | `gap-1` |

---

## 5. Component Updates

### 5.1 Cards

Current cards need refinement to match the design system.

**Target styling:**
```tsx
// Base card
<Card className="bg-card border-border rounded-xl p-6 hover:bg-surface-elevated transition-colors">

// Metric card pattern
<Card className="bg-card border-border rounded-xl p-6">
  <div className="flex items-center justify-between mb-4">
    <span className="text-label text-muted-foreground uppercase tracking-wider flex items-center gap-2">
      <Icon size={14} />
      Label
    </span>
    <span className="text-xs text-subtle">Just now</span>
  </div>
  <p className="text-sm text-muted-foreground mb-3">Description text</p>
  <p className="text-metric-lg font-semibold">$5,278.50</p>
  <p className="text-xs text-subtle mt-3">Secondary link</p>
</Card>
```

### 5.2 Buttons

**Ghost/Pill buttons:**
```tsx
<Button variant="outline" className="rounded-full border-border hover:bg-surface-elevated">
  <Icon size={14} className="mr-2" />
  Label
</Button>
```

**Primary button:**
```tsx
<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Action
</Button>
```

### 5.3 Inputs

```tsx
<Input className="bg-card border-border rounded-xl px-5 py-4 focus:ring-2 focus:ring-ring/30 focus:border-ring" />
```

### 5.4 Navigation

Update sidebar icons:
```tsx
<button className={cn(
  "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
  isActive 
    ? "bg-muted text-foreground" 
    : "text-muted-foreground hover:text-foreground hover:bg-muted"
)}>
  <Icon size={20} />
</button>
```

---

## 6. Implementation Plan

### Phase 1: Foundation (Day 1)
1. [ ] Update globals.css with new CSS variables
2. [ ] Update tailwind.config.ts with extended colors, fonts, and type scale
3. [ ] Add GT Sectra font files (or configure Google Fonts/Font Source)
4. [ ] Verify dark mode is default/only theme

### Phase 2: Components (Day 1-2)
5. [ ] Update Card component styling
6. [ ] Update Button variants
7. [ ] Update Input styling
8. [ ] Update Dialog/Modal styling (already using shadcn)

### Phase 3: Layout (Day 2)
9. [ ] Update sidebar navigation styling
10. [ ] Refine page backgrounds
11. [ ] Update calendar cell styling
12. [ ] Update task list styling

### Phase 4: Polish (Day 3)
13. [ ] Audit all components for consistency
14. [ ] Fix any contrast issues (WCAG)
15. [ ] Add hover/focus states where missing
16. [ ] Test responsive behavior

---

## 7. Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | CSS variables, @font-face |
| `tailwind.config.ts` | Colors, fonts, type scale |
| `src/components/ui/card.tsx` | Default styling |
| `src/components/ui/button.tsx` | Variants update |
| `src/components/ui/input.tsx` | Border radius, padding |
| `src/components/Sidebar.tsx` | Icon nav styling |
| `src/components/MonthCalendar.tsx` | Cell styling |
| `src/components/TasksView.tsx` | List styling |

---

## 8. Success Criteria

- [ ] Page background is #0A0A0A
- [ ] Cards are #141414 with #262626 borders
- [ ] Headings use GT Sectra (display font)
- [ ] Body text uses Inter
- [ ] Focus rings use gold accent (#F5A623)
- [ ] All interactive elements have hover states
- [ ] Muted text meets WCAG contrast (bump to #8A8A8A if needed)
- [ ] Consistent 12px border radius on cards

---

## 9. Reference

**Original design system:** `/Users/sashi/.clawdbot/media/inbound/1df7df69-adfe-4585-9cbd-cd6fac89a413.md`

**Design principles:**
- Sophisticated dark theme
- Typography-driven hierarchy
- Minimal shadows (depth via color)
- Generous spacing
- Warm accent tones for highlights

---

## 10. Open Questions

1. **GT Sectra licensing** — Do we have the font files, or should we use an alternative (e.g., Playfair Display, Fraunces)?
2. **Gold accent usage** — Should we use the warm gold for primary actions throughout, or keep current neutral style?
3. **Calendar styling** — Should calendar cells adopt the card pattern, or stay minimal?

---

*PRD created by Sashi based on Mu's design-forensics analysis.*
