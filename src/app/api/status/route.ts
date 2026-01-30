import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

const SINGLETON_ID = "singleton";

async function getStatus() {
  try {
    const result = await db.query.sashiStatus.findFirst({
      where: eq(schema.sashiStatus.id, SINGLETON_ID),
    });

    if (!result) {
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
    }

    return result;
  } catch (error) {
    console.error("Error getting status:", error);
    return {
      id: SINGLETON_ID,
      state: "idle",
      task: null,
      startedAt: null,
      updatedAt: new Date(),
    };
  }
}

export async function GET() {
  const status = await getStatus();
  return NextResponse.json({
    state: status.state,
    task: status.task,
    startedAt: status.startedAt?.toISOString() || null,
    updatedAt: status.updatedAt?.toISOString() || new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newState = body.state || "idle";
    const newTask = body.task || null;

    // Upsert the status
    await db
      .insert(schema.sashiStatus)
      .values({
        id: SINGLETON_ID,
        state: newState,
        task: newTask,
        startedAt: newState === "working" ? now : null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: schema.sashiStatus.id,
        set: {
          state: newState,
          task: newTask,
          startedAt: newState === "working" ? now : null,
          updatedAt: now,
        },
      });

    return NextResponse.json({
      state: newState,
      task: newTask,
      startedAt: newState === "working" ? now.toISOString() : null,
      updatedAt: now.toISOString(),
    });
  } catch (error) {
    console.error("Error updating status:", error);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
