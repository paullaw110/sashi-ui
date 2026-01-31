import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { sql } from "drizzle-orm";
import { generateId } from "@/lib/utils";

// Default colors to cycle through
const DEFAULT_COLORS = [
  "#EF4444", // red
  "#F59E0B", // amber
  "#10B981", // green
  "#3B82F6", // blue
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#6B7280", // gray
];

export async function GET() {
  try {
    // Get all tags with task counts
    const tagsWithCounts = await db.all(sql`
      SELECT 
        t.id,
        t.name,
        t.color,
        t.created_at as createdAt,
        COUNT(tt.task_id) as taskCount
      FROM tags t
      LEFT JOIN task_tags tt ON t.id = tt.tag_id
      GROUP BY t.id
      ORDER BY t.name ASC
    `);

    return NextResponse.json({ tags: tagsWithCounts });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Normalize tag name (lowercase, trim, replace spaces with hyphens)
    const normalizedName = name.trim().toLowerCase().replace(/\s+/g, "-");

    // Check if tag already exists
    const existing = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.name, normalizedName),
    });

    if (existing) {
      return NextResponse.json({ error: "Tag already exists", tag: existing }, { status: 409 });
    }

    // Get count of existing tags to determine default color
    const countResult = await db.all(sql`SELECT COUNT(*) as count FROM tags`);
    const tagCount = (countResult[0] as { count: number })?.count || 0;
    const defaultColor = DEFAULT_COLORS[tagCount % DEFAULT_COLORS.length];

    const id = generateId();
    const now = new Date();

    await db.insert(schema.tags).values({
      id,
      name: normalizedName,
      color: color || defaultColor,
      createdAt: now,
    });

    const tag = await db.query.tags.findFirst({
      where: (tags, { eq }) => eq(tags.id, id),
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
