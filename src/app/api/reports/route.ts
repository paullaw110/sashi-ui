import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET /api/reports - List reports
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'morning' | 'nightly' | null (all)
    const limit = parseInt(searchParams.get("limit") || "30");

    let reports;
    
    if (type) {
      reports = await db
        .select()
        .from(schema.reports)
        .where(eq(schema.reports.type, type))
        .orderBy(desc(schema.reports.date), desc(schema.reports.createdAt))
        .limit(limit);
    } else {
      reports = await db
        .select()
        .from(schema.reports)
        .orderBy(desc(schema.reports.date), desc(schema.reports.createdAt))
        .limit(limit);
    }

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports - Create a report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, date, title, content, metadata } = body;

    if (!type || !date || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: type, date, title, content" },
        { status: 400 }
      );
    }

    const id = nanoid();
    const now = new Date();

    await db.insert(schema.reports).values({
      id,
      type,
      date,
      title,
      content,
      metadata: metadata ? JSON.stringify(metadata) : null,
      createdAt: now,
    });

    const report = await db.query.reports.findFirst({
      where: eq(schema.reports.id, id),
    });

    return NextResponse.json({ report }, { status: 201 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { error: "Failed to create report" },
      { status: 500 }
    );
  }
}
