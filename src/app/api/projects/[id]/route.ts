import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
      with: {
        organization: true,
        tasks: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.name !== undefined) updates.name = body.name;
    if (body.color !== undefined) updates.color = body.color;
    if (body.icon !== undefined) updates.icon = body.icon;
    if (body.type !== undefined) updates.type = body.type;
    if (body.organizationId !== undefined) updates.organizationId = body.organizationId;

    const updatedProject = await db
      .update(schema.projects)
      .set(updates)
      .where(eq(schema.projects.id, id))
      .returning();

    if (updatedProject.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ project: updatedProject[0] });
  } catch (error) {
    console.error("Error updating project:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deletedProject = await db
      .delete(schema.projects)
      .where(eq(schema.projects.id, id))
      .returning();

    if (deletedProject.length === 0) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
