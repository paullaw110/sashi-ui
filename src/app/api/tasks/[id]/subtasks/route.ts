import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// Get subtasks for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentId } = await params;

    const subtasks = await db.query.tasks.findMany({
      where: eq(schema.tasks.parentId, parentId),
      orderBy: (tasks, { asc }) => [asc(tasks.createdAt)],
    });

    return NextResponse.json({ subtasks });
  } catch (error) {
    console.error("Error fetching subtasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch subtasks" },
      { status: 500 }
    );
  }
}

// Create subtasks from suggestions
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentId } = await params;
    const body = await request.json();
    const { subtasks } = body;

    if (!Array.isArray(subtasks) || subtasks.length === 0) {
      return NextResponse.json(
        { error: "Subtasks array is required" },
        { status: 400 }
      );
    }

    // Get parent task to inherit org/project
    const parentTask = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, parentId),
    });

    if (!parentTask) {
      return NextResponse.json(
        { error: "Parent task not found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const createdSubtasks = [];

    for (const subtask of subtasks) {
      const id = generateId();
      const newSubtask = {
        id,
        name: subtask.name,
        description: subtask.description || null,
        status: "not_started",
        priority: null,
        projectId: parentTask.projectId,
        organizationId: parentTask.organizationId,
        parentId,
        dueDate: parentTask.dueDate, // Inherit due date from parent
        createdAt: now,
        updatedAt: now,
      };

      await db.insert(schema.tasks).values(newSubtask);
      createdSubtasks.push(newSubtask);
    }

    return NextResponse.json({ created: createdSubtasks }, { status: 201 });
  } catch (error) {
    console.error("Error creating subtasks:", error);
    return NextResponse.json(
      { error: "Failed to create subtasks" },
      { status: 500 }
    );
  }
}
