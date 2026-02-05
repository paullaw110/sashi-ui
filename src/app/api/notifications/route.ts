import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, agents, tasks } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/notifications - Get notifications for an agent
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const undeliveredOnly = searchParams.get("undelivered") === "true";
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (!agentId) {
      return NextResponse.json({ error: "agentId is required" }, { status: 400 });
    }

    const result = await db
      .select({
        id: notifications.id,
        mentionedAgentId: notifications.mentionedAgentId,
        fromAgentId: notifications.fromAgentId,
        taskId: notifications.taskId,
        commentId: notifications.commentId,
        content: notifications.content,
        delivered: notifications.delivered,
        read: notifications.read,
        createdAt: notifications.createdAt,
        fromAgent: {
          id: agents.id,
          name: agents.name,
          avatar: agents.avatar,
        },
        task: {
          id: tasks.id,
          name: tasks.name,
        },
      })
      .from(notifications)
      .leftJoin(agents, eq(notifications.fromAgentId, agents.id))
      .leftJoin(tasks, eq(notifications.taskId, tasks.id))
      .where(eq(notifications.mentionedAgentId, agentId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);

    let filtered = result;
    if (undeliveredOnly) filtered = filtered.filter(n => !n.delivered);
    if (unreadOnly) filtered = filtered.filter(n => !n.read);

    return NextResponse.json(filtered);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
