import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const limit = parseInt(searchParams.get("limit") || "50");

  try {
    const items = await db.query.inboxItems.findMany({
      where: type ? eq(schema.inboxItems.type, type) : undefined,
      orderBy: [desc(schema.inboxItems.createdAt)],
      limit,
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching inbox items:", error);
    return NextResponse.json({ error: "Failed to fetch inbox items" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newItem = {
      id: generateId(),
      content: body.content,
      type: body.type || "note",
      url: body.url || null,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      createdAt: now,
    };

    await db.insert(schema.inboxItems).values(newItem);

    return NextResponse.json({ item: newItem }, { status: 201 });
  } catch (error) {
    console.error("Error creating inbox item:", error);
    return NextResponse.json({ error: "Failed to create inbox item" }, { status: 500 });
  }
}
