import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const lead = await db.query.leads.findFirst({
      where: eq(schema.leads.id, id),
    });

    if (!lead) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error fetching lead:", error);
    return NextResponse.json({ error: "Failed to fetch lead" }, { status: 500 });
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
    
    // Basic info
    if (body.businessName !== undefined) updates.businessName = body.businessName;
    if (body.industry !== undefined) updates.industry = body.industry;
    if (body.location !== undefined) updates.location = body.location;
    if (body.address !== undefined) updates.address = body.address;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.email !== undefined) updates.email = body.email;
    if (body.websiteUrl !== undefined) updates.websiteUrl = body.websiteUrl;
    if (body.websiteScreenshot !== undefined) updates.websiteScreenshot = body.websiteScreenshot;
    
    // Metrics
    if (body.googleRating !== undefined) updates.googleRating = body.googleRating;
    if (body.reviewCount !== undefined) updates.reviewCount = body.reviewCount;
    if (body.topReviews !== undefined) updates.topReviews = body.topReviews ? JSON.stringify(body.topReviews) : null;
    if (body.pagespeedScore !== undefined) updates.pagespeedScore = body.pagespeedScore;
    if (body.mobileFriendly !== undefined) updates.mobileFriendly = body.mobileFriendly;
    if (body.hasSSL !== undefined) updates.hasSSL = body.hasSSL;
    if (body.techStack !== undefined) updates.techStack = body.techStack ? JSON.stringify(body.techStack) : null;
    if (body.qualificationScore !== undefined) updates.qualificationScore = body.qualificationScore;
    if (body.issuesDetected !== undefined) updates.issuesDetected = body.issuesDetected ? JSON.stringify(body.issuesDetected) : null;
    
    // Status and notes
    if (body.status !== undefined) updates.status = body.status;
    if (body.notes !== undefined) updates.notes = body.notes;
    
    // Generated assets
    if (body.briefUrl !== undefined) updates.briefUrl = body.briefUrl;
    if (body.previewSiteUrl !== undefined) updates.previewSiteUrl = body.previewSiteUrl;
    if (body.outreachSentAt !== undefined) updates.outreachSentAt = body.outreachSentAt ? new Date(body.outreachSentAt) : null;

    await db.update(schema.leads)
      .set(updates)
      .where(eq(schema.leads.id, id));

    const lead = await db.query.leads.findFirst({
      where: eq(schema.leads.id, id),
    });

    return NextResponse.json({ lead });
  } catch (error) {
    console.error("Error updating lead:", error);
    return NextResponse.json({ error: "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    await db.delete(schema.leads).where(eq(schema.leads.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting lead:", error);
    return NextResponse.json({ error: "Failed to delete lead" }, { status: 500 });
  }
}
