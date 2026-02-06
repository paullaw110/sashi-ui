import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const brief = await db.query.briefs.findFirst({
      where: eq(schema.briefs.id, id),
    });

    if (!brief) {
      return NextResponse.json({ error: "Brief not found" }, { status: 404 });
    }

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Error fetching brief:", error);
    return NextResponse.json({ error: "Failed to fetch brief" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const body = await request.json();
    const now = new Date();

    const updates: Record<string, unknown> = { updatedAt: now };
    
    if (body.name !== undefined) updates.name = body.name;
    if (body.status !== undefined) updates.status = body.status;
    if (body.currentPhase !== undefined) updates.currentPhase = body.currentPhase;
    if (body.leadId !== undefined) updates.leadId = body.leadId;
    if (body.projectSetup !== undefined) updates.projectSetup = body.projectSetup;
    if (body.industryResearch !== undefined) updates.industryResearch = body.industryResearch;
    if (body.buyerPersona !== undefined) updates.buyerPersona = body.buyerPersona;
    if (body.offerDefinition !== undefined) updates.offerDefinition = body.offerDefinition;
    if (body.positioning !== undefined) updates.positioning = body.positioning;
    if (body.copyGeneration !== undefined) updates.copyGeneration = body.copyGeneration;
    if (body.designDirection !== undefined) updates.designDirection = body.designDirection;
    if (body.buildBrief !== undefined) updates.buildBrief = body.buildBrief;

    await db.update(schema.briefs)
      .set(updates)
      .where(eq(schema.briefs.id, id));

    const brief = await db.query.briefs.findFirst({
      where: eq(schema.briefs.id, id),
    });

    return NextResponse.json({ brief });
  } catch (error) {
    console.error("Error updating brief:", error);
    return NextResponse.json({ error: "Failed to update brief" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await db.delete(schema.briefs).where(eq(schema.briefs.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting brief:", error);
    return NextResponse.json({ error: "Failed to delete brief" }, { status: 500 });
  }
}
