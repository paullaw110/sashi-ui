import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ideaGauntletRuns } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET: Fetch a single gauntlet run by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [run] = await db
      .select()
      .from(ideaGauntletRuns)
      .where(eq(ideaGauntletRuns.id, id));

    if (!run) {
      return NextResponse.json({ error: "Run not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: run.id,
      idea: run.idea,
      result: JSON.parse(run.result),
      verdict: run.verdict,
      confidence: run.confidence,
      createdAt: run.createdAt,
    });
  } catch (error) {
    console.error("Error fetching gauntlet run:", error);
    return NextResponse.json({ error: "Failed to fetch run" }, { status: 500 });
  }
}

// DELETE: Remove a gauntlet run
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const result = await db
      .delete(ideaGauntletRuns)
      .where(eq(ideaGauntletRuns.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting gauntlet run:", error);
    return NextResponse.json({ error: "Failed to delete run" }, { status: 500 });
  }
}
