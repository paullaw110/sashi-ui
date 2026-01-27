# Creating Marketing Posts with Gemini (and LLMs)

Best practices for generating social media content with AI.

---

## Why Gemini Works Well for This

- **Large context window** (up to 1M tokens) — can ingest entire brand guides, dozens of example posts, website copy
- **Multimodal** — can analyze images, understand visual brand identity
- **Google ecosystem** — integrates with Docs, Sheets for workflow

---

## The Secret: Context > Prompting

The #1 mistake is asking for content without context. A prompt like "write an Instagram post for a coffee shop" gets generic slop.

**What actually works:**
1. Feed it 5-10 of the brand's best-performing posts
2. Include the brand voice guide
3. Give it the specific topic + goal
4. Ask it to match the patterns it sees

---

## Prompt Structure That Works

```
You are a social media content creator for [Brand Name].

## Brand Context
[Paste brand voice, audience, dos/don'ts from BRIEF.md]

## Example Posts That Performed Well
[Paste 3-5 actual posts with engagement data if you have it]

## Inspiration Posts
[Paste 1-2 posts from other accounts that capture the vibe]

## Today's Task
Create a [platform] post about [topic].
Goal: [awareness / engagement / conversion]
Include: [CTA / hashtags / emoji style]

Write 3 variations with different hooks.
```

---

## Advanced Techniques

### 1. Pattern Extraction First
Before generating, ask Gemini to analyze:
```
Look at these 10 posts from [Brand]. What patterns do you notice in:
- Opening hooks
- Sentence length
- Emoji usage
- CTA style
- Hashtag strategy

Summarize the brand's content "fingerprint."
```

Then use that fingerprint in future prompts.

### 2. Iterative Refinement
Don't accept the first output. Use:
- "Make it punchier"
- "Less salesy, more conversational"
- "Add a specific example instead of being generic"
- "Match the energy of example post #3"

### 3. Batch Generation
Generate a week's worth at once:
```
Create 7 posts for the week:
- Monday: [topic]
- Tuesday: [topic]
...
Keep consistent brand voice but vary the hooks.
```

### 4. A/B Hook Testing
```
Write 5 different opening hooks for this same post concept.
Range from curiosity-based to direct benefit to controversial take.
```

---

## What to Include in Your Context File

For each client, maintain:

| File | Contents |
|------|----------|
| `BRIEF.md` | Voice, audience, pillars, dos/don'ts |
| `examples/top-posts.md` | 10-15 best posts with why they worked |
| `inspo/references.md` | Posts from other brands they admire |
| `assets/key-copy.md` | Taglines, slogans, key phrases |

---

## Platform-Specific Tips

### Instagram
- Lead with a hook (first line is everything)
- 125-150 characters before the "more" cutoff
- Carousel-style posts: ask for slide-by-slide content

### LinkedIn
- Professional but not boring
- Ask for "thought leadership angle"
- Personal stories + business lesson format works

### Twitter/X
- Punchy, under 280 characters
- Thread format: "Write a 5-tweet thread on X"
- Ask for engagement hooks (questions, hot takes)

### Facebook
- Slightly longer form OK
- Community-focused language
- Events and local references

---

## Gemini vs Claude vs ChatGPT

| Model | Strength |
|-------|----------|
| **Gemini** | Huge context, multimodal, Google integrations |
| **Claude** | Nuanced voice matching, better at "less corporate" |
| **ChatGPT** | Fastest, good for high-volume iteration |

For client work, I'd use:
- **Gemini** for ingesting massive context (all their posts ever)
- **Claude** for final voice polish
- **ChatGPT** for rapid A/B variations

---

## Workflow for Client Channels

1. **Setup (once)**
   - Fill out BRIEF.md
   - Collect 10+ example posts
   - Note what makes them work

2. **Daily content**
   - Drop inspo post in channel
   - I extract the pattern
   - Generate variations in client's voice

3. **Review cycle**
   - You edit/approve
   - Feedback improves future outputs
   - Best results get added to examples/

---

## Anti-Patterns to Avoid

❌ "Write me a post about coffee"
❌ Generic prompts without brand context
❌ Accepting first draft
❌ Same prompt every time
❌ Ignoring what actually performed well

✅ Rich context + specific ask
✅ Pattern extraction from real data
✅ Iterative refinement
✅ Learning from engagement metrics
✅ Building a feedback loop

---

*Last updated: 2026-01-26*
