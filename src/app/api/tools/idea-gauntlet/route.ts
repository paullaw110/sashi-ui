import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { idea } = await request.json();

    if (!idea || typeof idea !== "string") {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 });
    }

    const result = analyzeIdea(idea);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing idea:", error);
    return NextResponse.json({ error: "Failed to analyze idea" }, { status: 500 });
  }
}

function analyzeIdea(idea: string) {
  const lower = idea.toLowerCase();
  
  // Detect patterns in the idea
  const patterns = {
    subscription: /subscription|recurring|monthly|saas|membership/i.test(idea),
    marketplace: /marketplace|platform|connect|match|two-sided/i.test(idea),
    ai: /ai|artificial intelligence|machine learning|gpt|llm|automat/i.test(idea),
    app: /app|mobile|ios|android/i.test(idea),
    service: /service|agency|consult|done-for-you/i.test(idea),
    ecommerce: /shop|store|sell|product|ecommerce|commerce/i.test(idea),
    b2b: /business|enterprise|company|companies|b2b|team/i.test(idea),
    b2c: /consumer|people|user|individual|personal/i.test(idea),
    health: /health|fitness|wellness|medical|doctor|patient/i.test(idea),
    finance: /finance|money|invest|payment|bank|crypto/i.test(idea),
    education: /learn|education|course|teach|training|skill/i.test(idea),
    content: /content|creator|video|social|media|influencer/i.test(idea),
    local: /local|restaurant|store|shop|neighborhood/i.test(idea),
    personalized: /personalized|custom|tailored|based on/i.test(idea),
    data: /data|analytics|insights|track|monitor/i.test(idea),
  };

  // Extract potential problem/solution
  const extractedProblem = extractProblem(idea);
  const extractedSolution = extractSolution(idea);
  
  // Generate clarity score based on specificity
  const clarityScore = calculateClarityScore(idea, patterns);
  
  // Generate one-liner
  const oneLiner = generateOneLiner(idea, patterns);
  
  // Generate kill shots based on patterns
  const killShots = generateKillShots(patterns, idea);
  
  // Generate market reality
  const marketReality = generateMarketReality(patterns, idea);
  
  // Generate edge analysis
  const yourEdge = generateEdgeAnalysis(patterns, idea);
  
  // Generate verdict
  const verdict = generateVerdict(clarityScore, killShots, patterns);

  return {
    clarityCheck: {
      oneLiner,
      problem: extractedProblem,
      solution: extractedSolution,
      score: clarityScore,
    },
    killShots,
    marketReality,
    yourEdge,
    verdict,
  };
}

function extractProblem(idea: string): string {
  // Look for problem indicators
  if (idea.includes("because") || idea.includes("since")) {
    const match = idea.match(/(?:because|since)\s+([^.]+)/i);
    if (match) return match[1].trim();
  }
  
  // Default: infer from context
  const problemPhrases = [
    "finding the right",
    "hard to",
    "difficult to",
    "struggle with",
    "don't have",
    "can't easily",
    "waste time",
    "too expensive",
    "too complicated",
  ];
  
  for (const phrase of problemPhrases) {
    if (idea.toLowerCase().includes(phrase)) {
      return `People ${phrase} ${extractContext(idea, phrase)}`;
    }
  }
  
  return "Problem not clearly stated — you need to articulate what pain point this solves";
}

function extractSolution(idea: string): string {
  // Look for solution indicators
  const solutionIndicators = ["that", "which", "to help", "helps", "makes it", "allows"];
  
  for (const indicator of solutionIndicators) {
    const regex = new RegExp(`${indicator}\\s+([^.]+)`, "i");
    const match = idea.match(regex);
    if (match) {
      return match[1].trim().charAt(0).toUpperCase() + match[1].trim().slice(1);
    }
  }
  
  return extractFirstAction(idea);
}

function extractContext(idea: string, phrase: string): string {
  const lower = idea.toLowerCase();
  const idx = lower.indexOf(phrase);
  if (idx === -1) return "";
  const after = idea.slice(idx + phrase.length, idx + phrase.length + 50);
  return after.split(/[.,!?]/)[0].trim();
}

function extractFirstAction(idea: string): string {
  const words = idea.split(" ").slice(0, 15).join(" ");
  return words.length < idea.length ? words + "..." : words;
}

function calculateClarityScore(idea: string, patterns: Record<string, boolean>): number {
  let score = 5; // Base score
  
  // Specificity bonuses
  if (idea.length > 100) score += 1;
  if (idea.includes("$") || /\d+/.test(idea)) score += 1; // Numbers = specificity
  if (patterns.b2b || patterns.b2c) score += 1; // Clear target
  if (idea.includes("because") || idea.includes("problem")) score += 1; // Problem clarity
  
  // Penalties
  if (idea.length < 50) score -= 2;
  if (!patterns.b2b && !patterns.b2c) score -= 1;
  if (idea.includes("everything") || idea.includes("everyone")) score -= 2; // Too broad
  
  return Math.max(1, Math.min(10, score));
}

function generateOneLiner(idea: string, patterns: Record<string, boolean>): string {
  // Try to condense the idea
  const words = idea.split(" ");
  if (words.length <= 15) return idea;
  
  // Extract core concept
  let core = words.slice(0, 12).join(" ");
  if (!core.endsWith(".")) core += "...";
  
  return core;
}

function generateKillShots(patterns: Record<string, boolean>, idea: string): string[] {
  const shots: string[] = [];
  
  // Universal concerns
  shots.push("Distribution is the real problem — how will people discover this? Most ideas die from obscurity, not competition.");
  
  // Pattern-specific kill shots
  if (patterns.subscription) {
    shots.push("Subscription fatigue is real. People are cutting subscriptions, not adding them. Why will they keep paying month after month?");
  }
  
  if (patterns.marketplace) {
    shots.push("Marketplaces have a brutal chicken-and-egg problem. You need supply to attract demand and demand to attract supply. Most fail here.");
  }
  
  if (patterns.ai) {
    shots.push("'AI-powered' is table stakes now, not a differentiator. What happens when OpenAI/Google ships this feature natively?");
  }
  
  if (patterns.app) {
    shots.push("App store discovery is nearly impossible. User acquisition costs are brutal. Most apps get < 1000 downloads ever.");
  }
  
  if (patterns.personalized) {
    shots.push("Personalization requires data. Users won't give you data until they trust you. How do you deliver value before you have their data?");
  }
  
  if (patterns.local) {
    shots.push("Local businesses are notoriously hard to sell to. High churn, low tech adoption, price sensitive. The graveyard of startups.");
  }
  
  if (patterns.health) {
    shots.push("Health/medical = regulatory nightmare. HIPAA, FDA, liability. Are you prepared for 2-3 years of compliance before launch?");
  }
  
  if (patterns.finance) {
    shots.push("FinTech is heavily regulated. Banking licenses, compliance, legal fees. Do you have $500K+ for regulatory runway?");
  }
  
  if (patterns.content) {
    shots.push("Creator economy is oversaturated. Attention is the scarcest resource. Why would creators switch to yet another platform?");
  }
  
  // Add general concerns if we don't have enough
  const generalConcerns = [
    "What's the switching cost for users? If it's low, they'll leave the moment something slightly better appears.",
    "This sounds like a feature, not a product. What stops a bigger player from adding this to their existing product?",
    "How does this make money? If the business model isn't clear, the business won't exist.",
  ];
  
  while (shots.length < 5) {
    const concern = generalConcerns.shift();
    if (concern && !shots.includes(concern)) {
      shots.push(concern);
    } else {
      break;
    }
  }
  
  return shots.slice(0, 5);
}

function generateMarketReality(patterns: Record<string, boolean>, idea: string): {
  existingAlternatives: string[];
  whoPaysTodayFor: string;
  marketSize: string;
  difficulty: string;
} {
  const alternatives: string[] = [];
  let whoPays = "";
  let marketSize = "";
  let difficulty = "";
  
  // Generate alternatives based on patterns
  if (patterns.ai) {
    alternatives.push("ChatGPT, Claude, Gemini (general AI assistants)");
    alternatives.push("Specialized AI tools in this vertical");
  }
  
  if (patterns.subscription && patterns.health) {
    alternatives.push("Care/of, Ritual, Persona (vitamin subscriptions)");
    alternatives.push("Amazon Subscribe & Save");
    whoPays = "Health-conscious consumers, typically 25-45, $50-100/mo on wellness";
    marketSize = "Personalized nutrition: ~$12B market, growing 8% annually";
  }
  
  if (patterns.marketplace) {
    alternatives.push("Existing platforms in the vertical (Fiverr, Upwork, Thumbtack, etc.)");
    alternatives.push("Facebook Groups, Craigslist, word of mouth");
    difficulty = "HARD — marketplaces require $1M+ to reach liquidity";
  }
  
  if (patterns.local) {
    alternatives.push("Yelp, Google Business, Facebook Pages");
    alternatives.push("Local agencies, freelancers");
    whoPays = "Local business owners with marketing budgets ($200-2000/mo typical)";
    difficulty = "HARD — high churn, manual sales process, low LTV";
  }
  
  if (patterns.b2b) {
    alternatives.push("Existing enterprise solutions in this space");
    alternatives.push("Manual processes / spreadsheets / internal tools");
    whoPays = "Companies with this problem, typically $1K-50K/year software budgets";
    marketSize = "Depends on vertical — B2B SaaS typically 10-100x smaller than B2C but higher LTV";
  }
  
  if (patterns.education) {
    alternatives.push("Coursera, Udemy, Skillshare (general)");
    alternatives.push("YouTube (free), Books, Bootcamps");
    whoPays = "Self-improvers willing to pay $20-500 for skill development";
  }
  
  // Defaults
  if (alternatives.length === 0) {
    alternatives.push("Research needed — who solves this problem today?");
    alternatives.push("Manual workarounds / status quo");
  }
  
  if (!whoPays) {
    whoPays = "Unclear — you need to identify who has this problem AND budget to solve it";
  }
  
  if (!marketSize) {
    marketSize = "Unknown — research TAM/SAM/SOM for this specific vertical";
  }
  
  if (!difficulty) {
    if (patterns.ai) difficulty = "MEDIUM — crowded but fast-moving, differentiation is key";
    else if (patterns.service) difficulty = "EASY to start, HARD to scale — trading time for money";
    else if (patterns.ecommerce) difficulty = "MEDIUM — logistics and margins are the challenge";
    else difficulty = "MEDIUM — standard startup challenges apply";
  }
  
  return {
    existingAlternatives: alternatives,
    whoPaysTodayFor: whoPays,
    marketSize,
    difficulty,
  };
}

function generateEdgeAnalysis(patterns: Record<string, boolean>, idea: string): {
  whyYou: string;
  whyNow: string;
  unfairAdvantage: string;
  moatPotential: string;
} {
  let whyNow = "";
  
  if (patterns.ai) {
    whyNow = "AI capabilities are exploding — there's a window to build vertical-specific tools before consolidation";
  } else if (patterns.local) {
    whyNow = "Post-COVID local businesses need digital presence more than ever";
  } else {
    whyNow = "Not clearly time-sensitive — why couldn't this have been built 2 years ago? Why not 2 years from now?";
  }
  
  return {
    whyYou: "Unknown — what unique insight, experience, or access do YOU have that makes you the right person to build this?",
    whyNow,
    unfairAdvantage: "Not stated — an unfair advantage is something competitors can't easily copy (proprietary data, unique distribution, deep expertise, exclusive partnerships)",
    moatPotential: patterns.marketplace 
      ? "Network effects possible if you reach critical mass" 
      : patterns.data 
        ? "Data moat possible if you can accumulate proprietary data others don't have"
        : patterns.subscription
          ? "Switching costs + habit formation could create retention moat"
          : "Weak — most ideas can be copied quickly. What makes this defensible?",
  };
}

function generateVerdict(
  clarityScore: number,
  killShots: string[],
  patterns: Record<string, boolean>
): {
  decision: "GO" | "PAUSE" | "KILL";
  confidence: number;
  reasoning: string;
  nextSteps: string[];
} {
  // Calculate a rough score
  let score = 50;
  
  score += (clarityScore - 5) * 5; // Clarity impact
  
  // Pattern adjustments
  if (patterns.ai && !patterns.b2b) score -= 10; // Consumer AI is brutal
  if (patterns.marketplace) score -= 15; // Marketplaces are very hard
  if (patterns.local) score -= 10; // Local is a grind
  if (patterns.health || patterns.finance) score -= 10; // Regulated industries
  if (patterns.b2b && patterns.subscription) score += 10; // B2B SaaS is good
  if (patterns.service) score += 5; // Services are easier to start
  
  let decision: "GO" | "PAUSE" | "KILL";
  let reasoning: string;
  let nextSteps: string[];
  
  if (score >= 60) {
    decision = "GO";
    reasoning = "The idea has merit and the path forward is reasonably clear. The kill shots are real but manageable. Worth testing with minimal investment.";
    nextSteps = [
      "Talk to 10 potential customers this week — do they have this problem?",
      "Find out how they solve it today and what they pay",
      "Build the smallest possible version to test demand",
      "Set a kill metric: if X doesn't happen in Y weeks, move on",
    ];
  } else if (score >= 40) {
    decision = "PAUSE";
    reasoning = "The idea has potential but significant gaps. Don't build yet — you need more clarity on the problem, market, or your edge.";
    nextSteps = [
      "Clarify the specific problem and who has it",
      "Research competitors deeply — why haven't they won?",
      "Identify your unfair advantage (or admit you don't have one)",
      "Consider: is there a simpler version of this idea?",
    ];
  } else {
    decision = "KILL";
    reasoning = "The kill shots are too strong. This idea faces fundamental challenges that enthusiasm won't overcome. Your time is better spent elsewhere.";
    nextSteps = [
      "Accept the feedback — being honest saves you months",
      "Extract the kernel: what problem were you really trying to solve?",
      "Look for adjacent ideas with fewer structural problems",
      "Move on quickly — the next idea might be the one",
    ];
  }
  
  const confidence = Math.min(85, Math.max(40, 50 + Math.abs(score - 50)));
  
  return {
    decision,
    confidence,
    reasoning,
    nextSteps,
  };
}
