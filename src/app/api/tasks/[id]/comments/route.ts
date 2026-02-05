import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { taskComments, agents, activityFeed, notifications, taskSubscriptions, tasks } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

function parseMentions(content: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1].toLowerCase());
  }
  return [...new Set(mentions)];
}

// GET /api/tasks/:id/comments
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const comments = await db
      .select({
        id: taskComments.id,
        taskId: taskComments.taskId,
        agentId: taskComments.agentId,
        content: taskComments.content,
        attachments: taskComments.attachments,
        createdAt: taskComments.createdAt,
        agent: {
          id: agents.id,
          name: agents.name,
          avatar: agents.avatar,
          role: agents.role,
        },
      })
      .from(taskComments)
      .leftJoin(agents, eq(taskComments.agentId, agents.id))
      .where(eq(taskComments.taskId, taskId))
      .orderBy(taskComments.createdAt);

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/tasks/:id/comments
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { agentId, content, attachments } = body;

    if (!agentId || !content) {
      return NextResponse.json({ error: "agentId and content are required" }, { status: 400 });
    }

    const agent = await db.select().from(agents).where(eq(agents.id, agentId)).limit(1);
    if (agent.length === 0) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    const task = await db.select().from(tasks).where(eq(tasks.id, taskId)).limit(1);
    if (task.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const commentId = generateId();
    const now = new Date();

    const newComment = {
      id: commentId,
      taskId,
      agentId,
      content,
      attachments: attachments ? JSON.stringify(attachments) : null,
      createdAt: now,
    };

    await db.insert(taskComments).values(newComment);

    // Auto-subscribe commenter
    try {
      await db.insert(taskSubscriptions).values({ taskId, agentId, createdAt: now });
    } catch { /* ignore duplicate */ }

    // Parse @mentions and create notifications
    const mentions = parseMentions(content);
    if (mentions.length > 0) {
      const allAgents = await db.select().from(agents);
      const agentMap = new Map(allAgents.map(a => [a.id.toLowerCase(), a]));
      const agentNameMap = new Map(allAgents.map(a => [a.name.toLowerCase(), a]));

      for (const mention of mentions) {
        const mentionedAgent = agentMap.get(mention) || agentNameMap.get(mention);
        
        if (mentionedAgent && mentionedAgent.id !== agentId) {
          await db.insert(notifications).values({
            id: generateId(),
            mentionedAgentId: mentionedAgent.id,
            fromAgentId: agentId,
            taskId,
            commentId,
            content: `${agent[0].name} mentioned you on "${task[0].name}": "${content.substring(0, 100)}..."`,
            delivered: false,
            read: false,
            createdAt: now,
          });

          try {
            await db.insert(taskSubscriptions).values({ taskId, agentId: mentionedAgent.id, createdAt: now });
          } catch { /* ignore duplicate */ }
        }
      }
    }

    // Log to activity feed
    await db.insert(activityFeed).values({
      id: generateId(),
      type: "comment_added",
      agentId,
      taskId,
      message: `${agent[0].name} commented on "${task[0].name}"`,
      metadata: JSON.stringify({ commentId }),
      createdAt: now,
    });

    return NextResponse.json({
      ...newComment,
      agent: { id: agent[0].id, name: agent[0].name, avatar: agent[0].avatar, role: agent[0].role },
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
