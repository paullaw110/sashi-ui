import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { agents, activityFeed } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// GET /api/agents/:id - Get single agent
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);

    if (agent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    return NextResponse.json(agent[0]);
  } catch (error) {
    console.error("Error fetching agent:", error);
    return NextResponse.json({ error: "Failed to fetch agent" }, { status: 500 });
  }
}

// PATCH /api/agents/:id - Update agent
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, currentTaskId, lastActiveAt, name, role, description, avatar, model } = body;

    const updates: Record<string, unknown> = {};
    if (status !== undefined) updates.status = status;
    if (currentTaskId !== undefined) updates.currentTaskId = currentTaskId;
    if (lastActiveAt !== undefined) updates.lastActiveAt = new Date(lastActiveAt);
    if (name !== undefined) updates.name = name;
    if (role !== undefined) updates.role = role;
    if (description !== undefined) updates.description = description;
    if (avatar !== undefined) updates.avatar = avatar;
    if (model !== undefined) updates.model = model;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const currentAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);

    if (currentAgent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    await db.update(agents).set(updates).where(eq(agents.id, id));

    // Log status changes to activity feed
    if (status && status !== currentAgent[0].status) {
      await db.insert(activityFeed).values({
        id: generateId(),
        type: "agent_status_changed",
        agentId: id,
        taskId: currentTaskId || currentAgent[0].currentTaskId,
        message: `${currentAgent[0].name} is now ${status}`,
        metadata: JSON.stringify({ previousStatus: currentAgent[0].status, newStatus: status }),
        createdAt: new Date(),
      });
    }

    const updatedAgent = await db
      .select()
      .from(agents)
      .where(eq(agents.id, id))
      .limit(1);

    return NextResponse.json(updatedAgent[0]);
  } catch (error) {
    console.error("Error updating agent:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

// DELETE /api/agents/:id - Delete agent
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (id === "sashi") {
      return NextResponse.json({ error: "Cannot delete the primary agent" }, { status: 400 });
    }

    await db.delete(agents).where(eq(agents.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting agent:", error);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
