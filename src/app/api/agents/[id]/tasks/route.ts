import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, ne } from "drizzle-orm";

// GET /api/agents/:id/tasks - Get tasks assigned to an agent
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const includeDone = searchParams.get("includeDone") === "true";

    const tasks = await db.query.tasks.findMany({
      where: includeDone
        ? eq(schema.tasks.assignedAgentId, id)
        : and(
            eq(schema.tasks.assignedAgentId, id),
            ne(schema.tasks.status, "done")
          ),
      with: {
        project: true,
        organization: true,
      },
      orderBy: (tasks, { asc, desc }) => [
        // Sort by status (in_progress comes before todo alphabetically, done last)
        asc(tasks.status),
        asc(tasks.dueDate),
      ],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching agent tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch agent tasks" },
      { status: 500 }
    );
  }
}
