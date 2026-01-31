import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// Get tags for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const taskTags = await db.query.taskTags.findMany({
      where: eq(schema.taskTags.taskId, taskId),
      with: {
        tag: true,
      },
    });

    const tags = taskTags.map((tt) => tt.tag);

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching task tags:", error);
    return NextResponse.json({ error: "Failed to fetch task tags" }, { status: 500 });
  }
}

// Add a tag to a task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { tagId, name } = body;

    let finalTagId = tagId;

    // If name provided instead of tagId, find or create the tag
    if (!finalTagId && name) {
      const normalizedName = name.trim().toLowerCase().replace(/\s+/g, "-");
      
      let tag = await db.query.tags.findFirst({
        where: eq(schema.tags.name, normalizedName),
      });

      if (!tag) {
        // Create new tag with default color
        const DEFAULT_COLORS = ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"];
        const newId = generateId();
        const now = new Date();
        
        await db.insert(schema.tags).values({
          id: newId,
          name: normalizedName,
          color: DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)],
          createdAt: now,
        });

        tag = await db.query.tags.findFirst({
          where: eq(schema.tags.id, newId),
        });
      }

      finalTagId = tag?.id;
    }

    if (!finalTagId) {
      return NextResponse.json({ error: "Tag ID or name required" }, { status: 400 });
    }

    // Check if already tagged
    const existing = await db.query.taskTags.findFirst({
      where: and(
        eq(schema.taskTags.taskId, taskId),
        eq(schema.taskTags.tagId, finalTagId)
      ),
    });

    if (existing) {
      return NextResponse.json({ message: "Tag already added" }, { status: 200 });
    }

    // Add tag to task
    const now = new Date();
    await db.insert(schema.taskTags).values({
      taskId,
      tagId: finalTagId,
      createdAt: now,
    });

    // Get the tag details to return
    const tag = await db.query.tags.findFirst({
      where: eq(schema.tags.id, finalTagId),
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Error adding tag to task:", error);
    return NextResponse.json({ error: "Failed to add tag" }, { status: 500 });
  }
}

// Remove a tag from a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const { searchParams } = new URL(request.url);
    const tagId = searchParams.get("tagId");

    if (!tagId) {
      return NextResponse.json({ error: "Tag ID required" }, { status: 400 });
    }

    await db
      .delete(schema.taskTags)
      .where(
        and(
          eq(schema.taskTags.taskId, taskId),
          eq(schema.taskTags.tagId, tagId)
        )
      );

    return NextResponse.json({ message: "Tag removed" });
  } catch (error) {
    console.error("Error removing tag from task:", error);
    return NextResponse.json({ error: "Failed to remove tag" }, { status: 500 });
  }
}
