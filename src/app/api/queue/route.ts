import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    const items = await db.query.sashiQueue.findMany({
      orderBy: [desc(schema.sashiQueue.createdAt)],
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching queue:", error);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newItem = {
      id: generateId(),
      task: body.task,
      status: body.status || "queued",
      sessionKey: body.sessionKey || null,
      startedAt: body.status === "in_progress" ? now : null,
      completedAt: null,
      createdAt: now,
    };

    await db.insert(schema.sashiQueue).values(newItem);

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating queue item:", error);
    return NextResponse.json({ error: "Failed to create queue item" }, { status: 500 });
  }
}
