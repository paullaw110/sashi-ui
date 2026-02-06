import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
      with: {
        project: true,
        organization: true,
        assignedAgent: true,
        taskTags: {
          with: {
            tag: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    // Fetch subtasks separately
    const subtasks = await db.query.tasks.findMany({
      where: eq(schema.tasks.parentId, id),
      orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
    });

    // Transform tags to flat array
    const relationalTags = task.taskTags?.map((tt: any) => tt.tag) || [];

    return NextResponse.json({ 
      task: {
        ...task,
        relationalTags,
        subtasks,
      }
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    console.log("[PATCH /api/tasks/[id]] id:", id, "body:", JSON.stringify(body));
    const now = new Date();

    const updates: Record<string, unknown> = { updatedAt: now };
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.organizationId !== undefined) updates.organizationId = body.organizationId;
    if (body.projectId !== undefined) updates.projectId = body.projectId;
    if (body.assignedAgentId !== undefined) updates.assignedAgentId = body.assignedAgentId;
    if (body.priority !== undefined) updates.priority = body.priority;
    if (body.status !== undefined) updates.status = body.status;
    if (body.dueDate !== undefined) {
      // Parse date as noon local time to avoid timezone day-shift issues
      if (body.dueDate) {
        const dateStr = body.dueDate.includes("T") ? body.dueDate : body.dueDate + "T12:00:00";
        updates.dueDate = new Date(dateStr);
      } else {
        updates.dueDate = null;
      }
    }
    if (body.dueTime !== undefined) updates.dueTime = body.dueTime;
    if (body.duration !== undefined) updates.duration = body.duration;
    if (body.tags !== undefined) updates.tags = body.tags ? JSON.stringify(body.tags) : null;
    if (body.description !== undefined) updates.description = body.description;
    // PRD fields
    if (body.prd !== undefined) updates.prd = body.prd;
    if (body.prdContext !== undefined) updates.prdContext = body.prdContext;
    if (body.prdChat !== undefined) updates.prdChat = body.prdChat;
    if (body.parentId !== undefined) updates.parentId = body.parentId;

    await db.update(schema.tasks)
      .set(updates)
      .where(eq(schema.tasks.id, id));

    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, id),
      with: {
        project: true,
        organization: true,
      },
    });

    // Revalidate all pages that show tasks
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/tasks");

    return NextResponse.json({ task });
  } catch (error) {
    console.error("Error updating task:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: "Failed to update task", details: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await db.delete(schema.tasks).where(eq(schema.tasks.id, id));
    
    // Revalidate all pages that show tasks
    revalidatePath("/");
    revalidatePath("/calendar");
    revalidatePath("/tasks");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
