import { NextRequest, NextResponse } from "next/server";

// AI Generation endpoint for brief phases
// Uses smart templates that generate contextual content

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phase, context } = body;

    const content = generateContent(phase, context);

    return NextResponse.json({ content });
  } catch (error) {
    console.error("Error generating content:", error);
    return NextResponse.json({ error: "Failed to generate content" }, { status: 500 });
  }
}

function generateContent(phase: string, context: any): any {
  const { projectSetup, industryResearch, buyerPersona, offerDefinition, positioning, copyGeneration, designDirection } = context;
  
  const business = projectSetup?.businessName || "[Business Name]";
  const industry = projectSetup?.industry || "service";
  const location = projectSetup?.location || "local area";

  switch (phase) {
    case "industryResearch":
      return {
        overview: `The ${industry} industry in ${location} serves a growing population seeking quality, reliable services. Local providers compete on reputation, service quality, and customer experience. Digital presence is increasingly important as customers research online before making decisions.`,
        painPoints: `• Difficulty finding trustworthy, reliable providers
• Fear of being overcharged or experiencing hidden fees
• Uncertainty about quality until after service is complete
• Inconvenient scheduling and long wait times
• Poor communication and lack of follow-up
• Previous bad experiences with other providers`,
        triggers: `• Urgent need or emergency situation
• Recommendation from trusted friend or family member
• Moving to the area and need to establish new relationships
• Dissatisfaction with current provider
• Life change or milestone requiring services
• Online research prompting action`,
        trustSignals: `• High Google ratings (4.5+ stars) with recent reviews
• Years of experience in the community
• Professional certifications and credentials
• Before/after examples or case studies
• Clear, transparent pricing information
• Professional website and online presence`,
        competitors: `Research the top 3-5 ${industry} providers in ${location}. Analyze their:
• Website quality and messaging
• Google review ratings and common themes
• Pricing (if available)
• Unique selling points
• Weaknesses you can capitalize on`,
      };

    case "buyerPersona":
      return {
        demographics: `• Age: 30-60 years old
• Income: Middle to upper-middle class household income
• Location: ${location} and surrounding communities
• Homeowners or established renters
• Mix of families and professionals`,
        psychographics: `• Values quality and reliability over lowest price
• Busy lifestyle with limited time for research
• Seeks recommendations and reads online reviews
• Appreciates clear communication and professionalism
• Wants to feel confident in their decision
• Prefers established businesses over unknown entities`,
        goals: `• Find a trustworthy ${industry} provider they can rely on long-term
• Get the job done right the first time
• Feel confident they made a smart choice
• Avoid the stress of dealing with unreliable providers
• Establish a go-to provider for future needs`,
        fears: `• Getting ripped off or overcharged
• Poor quality work that needs to be redone
• Unreliable service (no-shows, late arrivals)
• Difficulty getting issues resolved after payment
• Wasting time with the wrong provider
• Feeling taken advantage of due to lack of knowledge`,
        decisionFactors: `• Online reviews and ratings (especially recent ones)
• Personal recommendations from people they trust
• Professional website that instills confidence
• Clear pricing and service information
• Response time and ease of booking
• Gut feeling about trustworthiness`,
      };

    case "offerDefinition":
      return {
        coreService: `${business} provides professional ${industry} services to ${location} residents and businesses. We combine expertise with personalized service to deliver results that exceed expectations.`,
        pricing: `Free consultation and estimate. Transparent pricing with no hidden fees. We provide detailed quotes upfront so you know exactly what to expect.`,
        differentiators: `• ${Math.floor(Math.random() * 15) + 10}+ years serving ${location} families
• 5-star rated with hundreds of satisfied customers
• Same-day or next-day availability for most services
• 100% satisfaction guarantee on all work
• Licensed, bonded, and fully insured
• Family-owned and operated with personal accountability`,
        guarantee: `100% Satisfaction Guarantee: If you're not completely satisfied with our work, we'll make it right at no additional cost. Your peace of mind is our priority.`,
        primaryCta: `Schedule Your Free Consultation`,
      };

    case "positioning":
      return {
        advantages: `• Deep roots in ${location} community (not a faceless corporation)
• Responsive service with real humans who answer the phone
• Consistent quality backed by our satisfaction guarantee
• Competitive pricing without sacrificing quality
• Building long-term relationships, not just transactions`,
        uniqueSellingPoints: `• The only ${industry} provider in ${location} with [specific credential/specialty]
• Family-owned since [year], serving multiple generations
• Unique [process/technology/approach] that delivers better results
• Community-focused: we sponsor [local team/charity/event]`,
        positioningStatement: `For ${location} residents who want reliable, professional ${industry} services without the hassle, ${business} delivers trusted expertise and personal attention that larger chains simply cannot match.`,
        onlyWe: `Only we combine deep local expertise with a genuine commitment to your complete satisfaction—because our reputation in this community is everything to us.`,
      };

    case "copyGeneration":
      const cta = offerDefinition?.primaryCta || "Schedule Your Free Consultation";
      return {
        heroHeadline: `${location}'s Most Trusted ${industry.charAt(0).toUpperCase() + industry.slice(1)} Service`,
        heroSubhead: `${business} has been serving families like yours for over a decade. Experience the difference that genuine care and expertise make.`,
        problemStatement: `Finding a ${industry} provider you can trust shouldn't feel like a gamble. Too many homeowners have been burned by unreliable service, surprise fees, and work that doesn't hold up. You deserve better.`,
        solutionStatement: `At ${business}, we've built our reputation one satisfied customer at a time. Our team delivers quality work, transparent pricing, and the kind of service that earns referrals. When you work with us, you're getting a partner who stands behind every job.`,
        benefits: `• Save time with prompt, reliable service that respects your schedule
• Enjoy peace of mind with our 100% satisfaction guarantee
• Know exactly what you'll pay with transparent, upfront pricing
• Get expert solutions from experienced professionals who care
• Build a relationship with a provider you can count on for years`,
        socialProof: `"${business} exceeded our expectations. Professional, on-time, and fair pricing. We won't go anywhere else!" — Sarah M., ${location}

★★★★★ 4.9 average rating from 200+ Google reviews
Trusted by over 1,000 ${location} families since [year]`,
        faq: `Q: How do I get started?
A: Call us or fill out our online form for a free consultation. We'll discuss your needs and provide a no-obligation estimate.

Q: What are your prices?
A: Every situation is unique, but we always provide detailed, written quotes before starting work. No surprises, guaranteed.

Q: Are you licensed and insured?
A: Absolutely. We're fully licensed, bonded, and insured for your protection and peace of mind.

Q: What if I'm not satisfied with the work?
A: We stand behind everything we do. If something isn't right, we'll fix it—that's our satisfaction guarantee.`,
        ctaVariations: `• ${cta}
• Get Your Free Quote
• Book Your Appointment Today
• Call Now: [Phone Number]
• Request a Callback`,
      };

    case "designDirection":
      const styleColors: Record<string, { primary: string; secondary: string; accent: string }> = {
        modern: { primary: "#0F172A", secondary: "#3B82F6", accent: "#10B981" },
        classic: { primary: "#1E3A5F", secondary: "#C9A962", accent: "#8B4513" },
        bold: { primary: "#7C3AED", secondary: "#EC4899", accent: "#F59E0B" },
        minimal: { primary: "#18181B", secondary: "#71717A", accent: "#3B82F6" },
        warm: { primary: "#78350F", secondary: "#D97706", accent: "#059669" },
        professional: { primary: "#1E40AF", secondary: "#1E293B", accent: "#10B981" },
      };
      
      const style = designDirection?.style || "professional";
      const colors = styleColors[style] || styleColors.professional;
      
      return {
        colorPalette: `Primary: ${colors.primary} — Main brand color for headers and key elements
Secondary: ${colors.secondary} — Supporting color for accents and highlights  
Accent: ${colors.accent} — CTAs and interactive elements
Background: #FFFFFF — Clean, light background
Surface: #F8FAFC — Cards and elevated sections
Text Primary: #1E293B — Main body text
Text Secondary: #64748B — Supporting text`,
        typography: `Headings: Inter, system-ui, or similar clean sans-serif
  - H1: 48px / 700 weight / tight tracking
  - H2: 36px / 600 weight
  - H3: 24px / 600 weight
  
Body: Inter or system font stack
  - Body: 16px / 400 weight / 1.6 line height
  - Small: 14px / 400 weight
  
Ensure excellent readability on all devices.`,
        references: `Look for ${style} ${industry} websites that convey:
• Trustworthiness and professionalism
• Local, personal service feel
• Clear calls to action
• Mobile-friendly design
• Fast loading times`,
        moodKeywords: `Trustworthy, Professional, Approachable, Reliable, Local, Established, Quality`,
      };

    case "buildBrief":
      return compileBuildBrief(context);

    default:
      return {};
  }
}

function compileBuildBrief(context: any): string {
  const { projectSetup, industryResearch, buyerPersona, offerDefinition, positioning, copyGeneration, designDirection } = context;
  
  const business = projectSetup?.businessName || "[Business Name]";
  const industry = projectSetup?.industry || "[Industry]";
  const location = projectSetup?.location || "[Location]";

  return `# BUILD-BRIEF: ${business} Website

## Quick Reference

| Field | Value |
|-------|-------|
| **Business** | ${business} |
| **Industry** | ${industry} |
| **Location** | ${location} |
| **Project Type** | ${projectSetup?.projectType || "new"} |
| **Primary CTA** | ${offerDefinition?.primaryCta || "Contact Us"} |

---

## 1. Positioning

### Positioning Statement
${positioning?.positioningStatement || "[Add positioning statement]"}

### Only We Statement
${positioning?.onlyWe || "[Add unique value proposition]"}

### Key Differentiators
${offerDefinition?.differentiators || "[Add differentiators]"}

---

## 2. Target Audience

### Demographics
${buyerPersona?.demographics || "[Add demographics]"}

### Goals & Motivations
${buyerPersona?.goals || "[Add goals]"}

### Fears & Objections
${buyerPersona?.fears || "[Add fears]"}

### Decision Factors
${buyerPersona?.decisionFactors || "[Add decision factors]"}

---

## 3. Website Copy

### Hero Section

**Headline:**
${copyGeneration?.heroHeadline || "[Add headline]"}

**Subheadline:**
${copyGeneration?.heroSubhead || "[Add subheadline]"}

**Primary CTA:** ${offerDefinition?.primaryCta || "Contact Us"}

---

### Problem Section
${copyGeneration?.problemStatement || "[Add problem statement]"}

---

### Solution Section
${copyGeneration?.solutionStatement || "[Add solution statement]"}

---

### Benefits
${copyGeneration?.benefits || "[Add benefits]"}

---

### Social Proof
${copyGeneration?.socialProof || "[Add testimonials and trust signals]"}

---

### FAQ
${copyGeneration?.faq || "[Add FAQ content]"}

---

### CTA Variations
${copyGeneration?.ctaVariations || "[Add CTA options]"}

---

## 4. Design Direction

### Style
**Overall Aesthetic:** ${designDirection?.style || "professional"}
**Mood Keywords:** ${designDirection?.moodKeywords || "Trustworthy, Professional, Approachable"}

### Color Palette
\`\`\`
${designDirection?.colorPalette || "Define color palette"}
\`\`\`

### Typography
\`\`\`
${designDirection?.typography || "Define typography"}
\`\`\`

### Design References
${designDirection?.references || "[Add reference sites]"}

---

## 5. Page Structure

### Homepage Sections
1. **Hero** — Headline, subhead, primary CTA, trust indicators
2. **Problem** — Agitate pain points, show understanding
3. **Solution** — Introduce ${business} as the answer
4. **Benefits** — Key value propositions with icons
5. **Social Proof** — Testimonials, ratings, trust badges
6. **Services Overview** — What you offer (cards/grid)
7. **About/Why Us** — Brief story, differentiators
8. **FAQ** — Address common objections
9. **Final CTA** — Strong closing with contact form

### Additional Pages
- **About** — Company story, team, values
- **Services** — Detailed service descriptions
- **Contact** — Form, phone, address, hours, map

---

## 6. Technical Requirements

### Performance
- Target PageSpeed score: 90+
- Optimize all images (WebP format)
- Lazy load below-fold content
- Minimize JavaScript

### SEO
- Semantic HTML structure
- Local business schema markup
- Optimized meta titles and descriptions
- Alt text on all images
- Mobile-first responsive design

### Forms
- Simple contact form (name, email, phone, message)
- Form validation with clear error messages
- Success confirmation message
- Email notification to business

### Analytics
- Google Analytics 4
- Conversion tracking on form submissions
- Call tracking (if applicable)

---

## 7. Content Needed from Client

- [ ] High-quality logo (SVG preferred)
- [ ] Professional photos (team, work, location)
- [ ] Exact business information (address, phone, hours)
- [ ] Real customer testimonials with names
- [ ] Service descriptions and pricing (if applicable)
- [ ] Social media links
- [ ] Any existing brand guidelines

---

*Generated by SuperLandings Brief Generator*
*Ready for implementation in Claude Code or your preferred development environment*
`;
}
