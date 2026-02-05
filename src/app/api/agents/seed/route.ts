import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, activityFeed } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

const INITIAL_AGENTS = [
  {
    id: "sashi",
    name: "Sashi",
    role: "Squad Lead",
    description: "Chief orchestrator. Coordinates work across all agents, maintains quality standards, and ensures nothing falls through the cracks.",
    avatar: "⚡",
    sessionKey: "agent:main:main",
    model: "anthropic/claude-opus-4-5",
  },
  {
    id: "kira",
    name: "Kira",
    role: "Researcher",
    description: "Deep investigator. Every claim has a source. Finds insights others miss and provides confidence levels with findings.",
    avatar: "🔍",
    sessionKey: "agent:kira:main",
    model: "anthropic/claude-sonnet-4-20250514",
  },
  {
    id: "mu",
    name: "Mu",
    role: "Designer",
    description: "Visual thinker. UI/UX expert who thinks in components and systems. Cares about craft. Doesn't just make mockups — builds the thing.",
    avatar: "🎨",
    sessionKey: "agent:mu:main",
    model: "anthropic/claude-sonnet-4-20250514",
  },
];

// POST /api/agents/seed - Seed initial agents
export async function POST() {
  try {
    const seeded: string[] = [];
    const skipped: string[] = [];
    const now = new Date();

    for (const agentData of INITIAL_AGENTS) {
      const existing = await db
        .select()
        .from(agents)
        .where(eq(agents.id, agentData.id))
        .limit(1);

      if (existing.length > 0) {
        skipped.push(agentData.id);
        continue;
      }

      await db.insert(agents).values({
        ...agentData,
        status: "idle",
        currentTaskId: null,
        lastActiveAt: null,
        createdAt: now,
      });

      await db.insert(activityFeed).values({
        id: generateId(),
        type: "agent_created",
        agentId: agentData.id,
        taskId: null,
        message: `${agentData.name} joined the squad as ${agentData.role}`,
        metadata: JSON.stringify({ avatar: agentData.avatar }),
        createdAt: now,
      });

      seeded.push(agentData.id);
    }

    return NextResponse.json({
      success: true,
      seeded,
      skipped,
      message: `Seeded ${seeded.length} agents, skipped ${skipped.length} existing`,
    });
  } catch (error) {
    console.error("Error seeding agents:", error);
    return NextResponse.json({ error: "Failed to seed agents" }, { status: 500 });
  }
}

// GET /api/agents/seed - Check seed status
export async function GET() {
  try {
    const existingAgents = await db.select().from(agents);
    const existingIds = new Set(existingAgents.map(a => a.id));

    const status = INITIAL_AGENTS.map(a => ({
      id: a.id,
      name: a.name,
      exists: existingIds.has(a.id),
    }));

    return NextResponse.json({
      agents: status,
      allSeeded: status.every(s => s.exists),
    });
  } catch (error) {
    console.error("Error checking seed status:", error);
    return NextResponse.json({ error: "Failed to check seed status" }, { status: 500 });
  }
}
