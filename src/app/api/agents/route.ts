import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";

// GET /api/agents - List all agents
export async function GET() {
  try {
    const allAgents = await db
      .select()
      .from(agents)
      .orderBy(agents.createdAt);

    return NextResponse.json(allAgents);
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

// POST /api/agents - Create new agent
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, name, role, description, avatar, sessionKey, model } = body;

    if (!name || !role || !sessionKey) {
      return NextResponse.json(
        { error: "name, role, and sessionKey are required" },
        { status: 400 }
      );
    }

    const newAgent = {
      id: id || generateId(),
      name,
      role,
      description: description || null,
      avatar: avatar || null,
      status: "idle" as const,
      sessionKey,
      model: model || null,
      currentTaskId: null,
      lastActiveAt: null,
      createdAt: new Date(),
    };

    await db.insert(agents).values(newAgent);

    return NextResponse.json(newAgent, { status: 201 });
  } catch (error) {
    console.error("Error creating agent:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
