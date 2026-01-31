import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const note = await db.query.notes.findFirst({
      where: eq(schema.notes.id, id),
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error fetching note:", error);
    return NextResponse.json({ error: "Failed to fetch note" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const now = new Date();

    const updates: Record<string, unknown> = { updatedAt: now };
    
    if (body.title !== undefined) updates.title = body.title;
    if (body.content !== undefined) updates.content = body.content;

    await db.update(schema.notes)
      .set(updates)
      .where(eq(schema.notes.id, id));

    const note = await db.query.notes.findFirst({
      where: eq(schema.notes.id, id),
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("Error updating note:", error);
    return NextResponse.json({ error: "Failed to update note" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await db.delete(schema.notes).where(eq(schema.notes.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting note:", error);
    return NextResponse.json({ error: "Failed to delete note" }, { status: 500 });
  }
}
