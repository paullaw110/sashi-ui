import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const organization = await db.query.organizations.findFirst({
      where: eq(schema.organizations.id, id),
      with: {
        projects: true,
        tasks: true,
      },
    });

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error("Error fetching organization:", error);
    return NextResponse.json({ error: "Failed to fetch organization" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updatedOrganization = await db
      .update(schema.organizations)
      .set({
        name: body.name,
        description: body.description,
      })
      .where(eq(schema.organizations.id, id))
      .returning();

    if (updatedOrganization.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ organization: updatedOrganization[0] });
  } catch (error) {
    console.error("Error updating organization:", error);
    return NextResponse.json({ error: "Failed to update organization" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedOrganization = await db
      .delete(schema.organizations)
      .where(eq(schema.organizations.id, id))
      .returning();

    if (deletedOrganization.length === 0) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Organization deleted successfully" });
  } catch (error) {
    console.error("Error deleting organization:", error);
    return NextResponse.json({ error: "Failed to delete organization" }, { status: 500 });
  }
}