import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq, desc } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET() {
  try {
    const organizations = await db.query.organizations.findMany({
      orderBy: desc(schema.organizations.createdAt),
      with: {
        projects: true,
      },
    });

    return NextResponse.json({ organizations });
  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Failed to fetch organizations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    const newOrganization = {
      id: generateId(),
      name: body.name,
      description: body.description || null,
      createdAt: now,
    };

    await db.insert(schema.organizations).values(newOrganization);

    // Revalidate pages that use organizations
    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ organization: newOrganization }, { status: 201 });
  } catch (error) {
    console.error("Error creating organization:", error);
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }
}