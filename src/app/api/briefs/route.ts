import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    const briefs = await db.query.briefs.findMany({
      orderBy: [desc(schema.briefs.updatedAt)],
    });

    return NextResponse.json({ briefs });
  } catch (error) {
    console.error("Error fetching briefs:", error);
    return NextResponse.json({ error: "Failed to fetch briefs" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newBrief = {
      id: generateId(),
      name: body.name || "Untitled Brief",
      status: body.status || "draft",
      currentPhase: body.currentPhase || 1,
      leadId: body.leadId || null,
      projectSetup: body.projectSetup || null,
      industryResearch: body.industryResearch || null,
      buyerPersona: body.buyerPersona || null,
      offerDefinition: body.offerDefinition || null,
      positioning: body.positioning || null,
      copyGeneration: body.copyGeneration || null,
      designDirection: body.designDirection || null,
      buildBrief: body.buildBrief || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.briefs).values(newBrief);

    return NextResponse.json({ brief: newBrief }, { status: 201 });
  } catch (error) {
    console.error("Error creating brief:", error);
    return NextResponse.json({ error: "Failed to create brief" }, { status: 500 });
  }
}
