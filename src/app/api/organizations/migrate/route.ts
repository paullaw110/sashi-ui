import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assignments } = body; // Array of { projectId, organizationId }

    if (!Array.isArray(assignments)) {
      return NextResponse.json({ error: "Invalid assignments format" }, { status: 400 });
    }

    const results = [];

    for (const assignment of assignments) {
      const { projectId, organizationId } = assignment;

      if (!projectId) {
        continue;
      }

      const updatedProject = await db
        .update(schema.projects)
        .set({
          organizationId: organizationId || null,
        })
        .where(eq(schema.projects.id, projectId))
        .returning();

      if (updatedProject.length > 0) {
        // Also update all tasks in this project to have the same organizationId
        await db
          .update(schema.tasks)
          .set({
            organizationId: organizationId || null,
          })
          .where(eq(schema.tasks.projectId, projectId));

        results.push({
          projectId,
          organizationId,
          success: true,
        });
      } else {
        results.push({
          projectId,
          organizationId,
          success: false,
          error: "Project not found",
        });
      }
    }

    return NextResponse.json({ 
      message: "Migration completed",
      results,
      total: assignments.length,
      successful: results.filter(r => r.success).length,
    });
  } catch (error) {
    console.error("Error during migration:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}