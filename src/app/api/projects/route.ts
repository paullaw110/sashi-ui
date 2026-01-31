import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const projects = await db.query.projects.findMany({
      orderBy: (projects, { asc }) => [asc(projects.name)],
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, organizationId, color, type } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const id = crypto.randomUUID();
    const now = new Date();

    await db.insert(schema.projects).values({
      id,
      name: name.trim(),
      organizationId: organizationId || null,
      color: color || null,
      icon: body.icon || null,
      type: type || null,
      createdAt: now,
    });

    const project = await db.query.projects.findFirst({
      where: eq(schema.projects.id, id),
    });

    revalidatePath("/");
    revalidatePath("/tasks");

    return NextResponse.json({ project });
  } catch (error) {
    console.error("Error creating project:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
