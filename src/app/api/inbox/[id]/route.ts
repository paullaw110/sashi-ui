import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await db.delete(schema.inboxItems).where(eq(schema.inboxItems.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting inbox item:", error);
    return NextResponse.json({ error: "Failed to delete inbox item" }, { status: 500 });
  }
}
