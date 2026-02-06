import { NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { agents, tasks } from "@/lib/db/schema";
import { generateId } from "@/lib/utils";
import { eq, and, ne, sql } from "drizzle-orm";

// GET /api/agents - List all agents with task counts
export async function GET() {
  try {
    // Get all agents with their current task
    const allAgents = await db.query.agents.findMany({
      with: {
        currentTask: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: agents.createdAt,
    });

    // Get assigned task counts per agent (only non-done tasks)
    const taskCounts = await db
      .select({
        agentId: tasks.assignedAgentId,
        total: sql<number>`count(*)`.as("total"),
        inProgress: sql<number>`sum(case when ${tasks.status} = 'in_progress' then 1 else 0 end)`.as("in_progress"),
      })
      .from(tasks)
      .where(
        and(
          ne(tasks.status, "done"),
          sql`${tasks.assignedAgentId} is not null`
        )
      )
      .groupBy(tasks.assignedAgentId);

    // Merge task counts into agents
    const taskCountMap = new Map(
      taskCounts.map((tc) => [tc.agentId, { total: tc.total, inProgress: tc.inProgress }])
    );

    const agentsWithCounts = allAgents.map((agent) => ({
      ...agent,
      assignedTaskCount: taskCountMap.get(agent.id)?.total || 0,
      inProgressTaskCount: taskCountMap.get(agent.id)?.inProgress || 0,
    }));

    return NextResponse.json(agentsWithCounts);
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
