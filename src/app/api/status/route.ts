import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const SINGLETON_ID = "singleton";

async function getOrCreateStatus() {
  try {
    // Try to get existing status
    const result = await db.query.sashiStatus.findFirst({
      where: eq(schema.sashiStatus.id, SINGLETON_ID),
    });

    if (result) {
      return result;
    }

    // Create default status if doesn't exist
    const now = new Date();
    const defaultStatus = {
      id: SINGLETON_ID,
      state: "idle" as const,
      task: null,
      startedAt: null,
      updatedAt: now,
    };
    
    await db.insert(schema.sashiStatus).values(defaultStatus);
    return defaultStatus;
  } catch (error) {
    console.error("Error getting status:", error);
    // Return default without throwing
    return {
      id: SINGLETON_ID,
      state: "idle" as const,
      task: null,
      startedAt: null,
      updatedAt: new Date(),
    };
  }
}

export async function GET() {
  const status = await getOrCreateStatus();
  return NextResponse.json({
    state: status.state,
    task: status.task,
    startedAt: status.startedAt instanceof Date ? status.startedAt.toISOString() : status.startedAt,
    updatedAt: status.updatedAt instanceof Date ? status.updatedAt.toISOString() : status.updatedAt,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newState = body.state || "idle";
    const newTask = body.task || null;
    const startedAt = newState === "working" ? now : null;

    // Ensure the row exists first
    await getOrCreateStatus();

    // Now update it
    await db
      .update(schema.sashiStatus)
      .set({
        state: newState,
        task: newTask,
        startedAt: startedAt,
        updatedAt: now,
      })
      .where(eq(schema.sashiStatus.id, SINGLETON_ID));

    return NextResponse.json({
      state: newState,
      task: newTask,
      startedAt: startedAt?.toISOString() || null,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
