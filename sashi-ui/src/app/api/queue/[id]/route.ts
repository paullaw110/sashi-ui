import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const now = new Date();

    const updates: Record<string, unknown> = {};
    
    if (body.task !== undefined) updates.task = body.task;
    if (body.status !== undefined) {
      updates.status = body.status;
      if (body.status === "in_progress" && !body.startedAt) {
        updates.startedAt = now;
      }
      if (body.status === "done") {
        updates.completedAt = now;
      }
    }
    if (body.sessionKey !== undefined) updates.sessionKey = body.sessionKey;

    await db.update(schema.sashiQueue)
      .set(updates)
      .where(eq(schema.sashiQueue.id, id));

    const item = await db.query.sashiQueue.findFirst({
      where: eq(schema.sashiQueue.id, id),
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Error updating queue item:", error);
    return NextResponse.json({ error: "Failed to update queue item" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await db.delete(schema.sashiQueue).where(eq(schema.sashiQueue.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting queue item:", error);
    return NextResponse.json({ error: "Failed to delete queue item" }, { status: 500 });
  }
}
