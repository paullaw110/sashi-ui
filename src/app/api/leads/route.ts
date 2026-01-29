import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status");
  const industry = searchParams.get("industry");

  try {
    let leads;
    
    if (status && industry) {
      leads = await db.query.leads.findMany({
        where: (l, { and, eq }) => and(
          eq(l.status, status),
          eq(l.industry, industry)
        ),
        orderBy: [desc(schema.leads.qualificationScore)],
      });
    } else if (status) {
      leads = await db.query.leads.findMany({
        where: eq(schema.leads.status, status),
        orderBy: [desc(schema.leads.qualificationScore)],
      });
    } else if (industry) {
      leads = await db.query.leads.findMany({
        where: eq(schema.leads.industry, industry),
        orderBy: [desc(schema.leads.qualificationScore)],
      });
    } else {
      leads = await db.query.leads.findMany({
        orderBy: [desc(schema.leads.qualificationScore)],
      });
    }

    return NextResponse.json({ leads });
  } catch (error) {
    console.error("Error fetching leads:", error);
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newLead = {
      id: generateId(),
      businessName: body.businessName,
      industry: body.industry,
      location: body.location,
      address: body.address || null,
      phone: body.phone || null,
      email: body.email || null,
      websiteUrl: body.websiteUrl || null,
      websiteScreenshot: body.websiteScreenshot || null,
      googleRating: body.googleRating || null,
      reviewCount: body.reviewCount || null,
      topReviews: body.topReviews ? JSON.stringify(body.topReviews) : null,
      pagespeedScore: body.pagespeedScore || null,
      mobileFriendly: body.mobileFriendly ?? null,
      hasSSL: body.hasSSL ?? null,
      techStack: body.techStack ? JSON.stringify(body.techStack) : null,
      qualificationScore: body.qualificationScore || null,
      issuesDetected: body.issuesDetected ? JSON.stringify(body.issuesDetected) : null,
      status: body.status || "new",
      notes: body.notes || null,
      briefUrl: body.briefUrl || null,
      previewSiteUrl: body.previewSiteUrl || null,
      outreachSentAt: body.outreachSentAt ? new Date(body.outreachSentAt) : null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.leads).values(newLead);

    return NextResponse.json({ lead: newLead }, { status: 201 });
  } catch (error) {
    console.error("Error creating lead:", error);
    return NextResponse.json({ error: "Failed to create lead" }, { status: 500 });
  }
}
