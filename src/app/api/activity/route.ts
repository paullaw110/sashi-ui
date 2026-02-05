import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { activityFeed, agents, tasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// GET /api/activity - Get activity feed
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const agentId = searchParams.get("agentId");
    const type = searchParams.get("type");
    const since = searchParams.get("since");

    const activities = await db
      .select({
        id: activityFeed.id,
        type: activityFeed.type,
        agentId: activityFeed.agentId,
        taskId: activityFeed.taskId,
        message: activityFeed.message,
        metadata: activityFeed.metadata,
        createdAt: activityFeed.createdAt,
        agent: {
          id: agents.id,
          name: agents.name,
          avatar: agents.avatar,
          role: agents.role,
        },
        task: {
          id: tasks.id,
          name: tasks.name,
        },
      })
      .from(activityFeed)
      .leftJoin(agents, eq(activityFeed.agentId, agents.id))
      .leftJoin(tasks, eq(activityFeed.taskId, tasks.id))
      .orderBy(desc(activityFeed.createdAt))
      .limit(limit);

    let filtered = activities;
    if (agentId) filtered = filtered.filter(a => a.agentId === agentId);
    if (type) filtered = filtered.filter(a => a.type === type);
    if (since) {
      const sinceDate = new Date(since);
      filtered = filtered.filter(a => a.createdAt && new Date(a.createdAt) >= sinceDate);
    }

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching activity:", error);
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 });
  }
}

// POST /api/activity - Log activity
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, agentId, taskId, message, metadata } = body;

    if (!type || !message) {
      return NextResponse.json({ error: "type and message are required" }, { status: 400 });
    }

    const newActivity = {
      id: generateId(),
      type,
      agentId: agentId || null,
      taskId: taskId || null,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: new Date(),
    };

    await db.insert(activityFeed).values(newActivity);
    return NextResponse.json(newActivity, { status: 201 });
  } catch (error) {
    console.error("Error logging activity:", error);
    return NextResponse.json({ error: "Failed to log activity" }, { status: 500 });
  }
}
