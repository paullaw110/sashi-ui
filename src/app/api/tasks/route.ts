import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { eq, and, gte, lte, isNull, or, inArray } from "drizzle-orm";
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
          taskTags: {
            with: {
              tag: true,
            },
          },
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
          taskTags: {
            with: {
              tag: true,
            },
          },
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
          taskTags: {
            with: {
              tag: true,
            },
          },
        },
        orderBy: (tasks, { asc }) => [asc(tasks.dueDate)],
      });
    }

    // Get subtask counts for all tasks
    const taskIds = tasks.map((t: any) => t.id);
    const subtaskCounts = new Map<string, { total: number; done: number }>();
    
    if (taskIds.length > 0) {
      // Fetch all subtasks for these parent tasks
      const allSubtasks = await db.query.tasks.findMany({
        where: (tasks, { inArray }) => inArray(tasks.parentId, taskIds),
        columns: { parentId: true, status: true },
      });
      
      // Count subtasks per parent
      for (const subtask of allSubtasks) {
        if (!subtask.parentId) continue;
        const current = subtaskCounts.get(subtask.parentId) || { total: 0, done: 0 };
        current.total++;
        if (subtask.status === "done") current.done++;
        subtaskCounts.set(subtask.parentId, current);
      }
    }

    // Transform taskTags to a flat tags array and add subtask counts
    // Also filter out subtasks (they're shown under their parent task)
    const includeSubtasks = searchParams.get("includeSubtasks") === "true";
    
    tasks = tasks
      .filter((task: any) => includeSubtasks || !task.parentId)
      .map((task: any) => {
        const subtaskInfo = subtaskCounts.get(task.id);
        return {
          ...task,
          relationalTags: task.taskTags?.map((tt: any) => tt.tag) || [],
          subtaskCount: subtaskInfo?.total || 0,
          subtaskDoneCount: subtaskInfo?.done || 0,
        };
      });

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

    // Query back with relations for complete task data
    const task = await db.query.tasks.findFirst({
      where: eq(schema.tasks.id, newTask.id),
      with: {
        project: true,
        organization: true,
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
