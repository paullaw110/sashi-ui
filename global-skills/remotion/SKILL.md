---
name: remotion
description: Create animated video clips from designs using Remotion (React-based video framework). For social media posts, design showcases, and UI animations.
metadata:
  tags: remotion, video, animation, social-media, design
---

## When to use

Use this skill when asked to:
- Create animated clips from designs or Figma exports
- Make social media video posts (Instagram, TikTok, Twitter, LinkedIn)
- Animate UI/UX mockups or design presentations
- Generate motion graphics from static assets

## Project Location

```
~/clawd/remotion/my-video/
```

## Quick Commands

```bash
# Start preview (Remotion Studio)
cd ~/clawd/remotion/my-video && npm run dev

# Render a composition
npx remotion render [CompositionId] out/output.mp4

# Render as GIF
npx remotion render [CompositionId] out/output.gif
```

## Core Concepts

### Animations are frame-based
All animations MUST use `useCurrentFrame()`. CSS transitions/animations are FORBIDDEN.

```tsx
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

const MyAnimation = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  // Linear interpolation
  const opacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
  
  // Spring animation (more natural)
  const scale = spring({ frame, fps, config: { damping: 200 } });
  
  return <div style={{ opacity, transform: `scale(${scale})` }}>Hello</div>;
};
```

### Spring presets
```tsx
const smooth = { damping: 200 };           // Smooth, no bounce
const snappy = { damping: 20, stiffness: 200 };  // Quick with minimal bounce
const bouncy = { damping: 8 };             // Playful bounce
```

### Sequencing
```tsx
import { Sequence, Series } from 'remotion';

// Delay an element
<Sequence from={30} premountFor={fps}>
  <Title />
</Sequence>

// Play elements one after another
<Series>
  <Series.Sequence durationInFrames={60}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={90}><Main /></Series.Sequence>
</Series>
```

### Static assets
Place files in `public/` folder, reference with `staticFile()`:
```tsx
import { Img, staticFile } from 'remotion';

<Img src={staticFile('my-design.png')} />
```

## Available Templates

| ID | Dimensions | Use case |
|----|------------|----------|
| `SocialPost-Square` | 1080x1080 | Instagram feed |
| `SocialPost-Vertical` | 1080x1920 | Reels, TikTok, Stories |
| `SocialPost-Horizontal` | 1280x720 | Twitter, LinkedIn |
| `DesignShowcase-Desktop` | 1920x1080 | Design presentations |
| `DesignShowcase-Square` | 1080x1080 | Square design showcase |

## Reusable Components

### FadeIn
```tsx
import { FadeIn } from './components';

<FadeIn durationFrames={20} delay={10} withScale>
  <h1>Hello</h1>
</FadeIn>
```

### SlideIn
```tsx
import { SlideIn } from './components';

<SlideIn direction="left" distance={100} delay={15} withFade>
  <Button>Click me</Button>
</SlideIn>
```

## Workflow: Design → Video

1. **Get assets**: Export from Figma → drop in `public/`
2. **Create composition**: New file in `src/compositions/`
3. **Register**: Add to `src/Root.tsx`
4. **Preview**: `npm run dev`
5. **Render**: `npx remotion render [id] out/video.mp4`

## Common Dimensions

| Platform | Size | FPS |
|----------|------|-----|
| Instagram Reel | 1080x1920 | 30 |
| Instagram Feed | 1080x1080 | 30 |
| TikTok | 1080x1920 | 30 |
| Twitter/X | 1280x720 | 30 |
| LinkedIn | 1920x1080 | 30 |

## Detailed Rules

For advanced patterns (captions, 3D, charts, transitions), read the official skills:
```
~/clawd/remotion/my-video/skills/remotion-best-practices/rules/
```

Key rules:
- `animations.md` - Animation fundamentals
- `timing.md` - Springs, easing, interpolation
- `sequencing.md` - Timing and delays
- `text-animations.md` - Typography effects
- `transitions.md` - Scene transitions
