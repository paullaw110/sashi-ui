import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    const notes = await db.query.notes.findMany({
      orderBy: [desc(schema.notes.updatedAt)],
    });

    return NextResponse.json({ notes });
  } catch (error) {
    console.error("Error fetching notes:", error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newNote = {
      id: generateId(),
      title: body.title || "Untitled",
      content: body.content || "",
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.notes).values(newNote);

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("Error creating note:", error);
    return NextResponse.json({ error: "Failed to create note" }, { status: 500 });
  }
}
