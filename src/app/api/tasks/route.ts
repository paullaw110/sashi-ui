import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte, isNull, or } from "drizzle-orm";
import { generateId } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const view = searchParams.get("view") || "today";
  const status = searchParams.get("status");
  const projectId = searchParams.get("projectId");
  const organizationId = searchParams.get("organizationId");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000);

  let tasks;

  try {
    if (view === "today") {
      tasks = await db.query.tasks.findMany({
        where: and(
          or(
            and(
              gte(schema.tasks.dueDate, startOfDay),
              lte(schema.tasks.dueDate, endOfDay)
            ),
            isNull(schema.tasks.dueDate)
          ),
          status ? eq(schema.tasks.status, status) : undefined,
          projectId ? eq(schema.tasks.projectId, projectId) : undefined,
          organizationId ? eq(schema.tasks.organizationId, organizationId) : undefined
        ),
        with: {
          project: true,
          organization: true,
        },
        orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
      });
    } else if (view === "week") {
      tasks = await db.query.tasks.findMany({
        where: and(
          gte(schema.tasks.dueDate, startOfDay),
          lte(schema.tasks.dueDate, endOfWeek),
          status ? eq(schema.tasks.status, status) : undefined,
          organizationId ? eq(schema.tasks.organizationId, organizationId) : undefined
        ),
        with: {
          project: true,
          organization: true,
        },
        orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
      });
    } else {
      tasks = await db.query.tasks.findMany({
        where: and(
          status ? eq(schema.tasks.status, status) : undefined,
          projectId ? eq(schema.tasks.projectId, projectId) : undefined,
          organizationId ? eq(schema.tasks.organizationId, organizationId) : undefined
        ),
        with: {
          project: true,
          organization: true,
        },
        orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
      });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const now = new Date();

    // Parse dueDate - handle both ISO strings and date-only strings
    let parsedDueDate: Date | null = null;
    if (body.dueDate) {
      // If it's already an ISO string with time, use it directly
      if (body.dueDate.includes("T")) {
        parsedDueDate = new Date(body.dueDate);
      } else {
        // If it's just a date (YYYY-MM-DD), add noon time
        parsedDueDate = new Date(body.dueDate + "T12:00:00");
      }
    }

    const newTask = {
      id: generateId(),
      name: body.name,
      projectId: body.projectId || null,
      organizationId: body.organizationId || null,
      priority: body.priority || null,
      status: body.status || "not_started",
      dueDate: parsedDueDate,
      dueTime: body.dueTime || null,
      duration: body.duration || null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      description: body.description || null,
      notionId: body.notionId || null,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(schema.tasks).values(newTask);

    return NextResponse.json({ task: newTask }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
