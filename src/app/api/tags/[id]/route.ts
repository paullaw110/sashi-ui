import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tag = await db.query.tags.findFirst({
      where: eq(schema.tags.id, id),
    });

    if (!tag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag });
  } catch (error) {
    console.error("Error fetching tag:", error);
    return NextResponse.json({ error: "Failed to fetch tag" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) {
      updates.name = body.name.trim().toLowerCase().replace(/\s+/g, "-");
    }
    if (body.color !== undefined) updates.color = body.color;

    const updatedTag = await db
      .update(schema.tags)
      .set(updates)
      .where(eq(schema.tags.id, id))
      .returning();

    if (updatedTag.length === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ tag: updatedTag[0] });
  } catch (error) {
    console.error("Error updating tag:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Delete tag (cascade will remove from task_tags)
    const deletedTag = await db
      .delete(schema.tags)
      .where(eq(schema.tags.id, id))
      .returning();

    if (deletedTag.length === 0) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Tag deleted successfully" });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return NextResponse.json({ error: "Failed to delete tag" }, { status: 500 });
  }
}
