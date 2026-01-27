import { db, schema } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";
import { AppLayout } from "@/components/AppLayout";
import { eq, and, gte, lte, not } from "drizzle-orm";

export const metadata = { title: "Dashboard" };

// Custom sort order for status (ascending)
const STATUS_ORDER: Record<string, number> = {
  not_started: 0,
  in_progress: 1,
  waiting: 2,
  done: 3,
};

// Custom sort order for priority (descending - highest first)
const PRIORITY_ORDER: Record<string, number> = {
  "non-negotiable": 0,
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

function sortTasks<T extends { status: string; priority: string | null }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    // First sort by status (ascending)
    const statusA = STATUS_ORDER[a.status] ?? 99;
    const statusB = STATUS_ORDER[b.status] ?? 99;
    if (statusA !== statusB) return statusA - statusB;
    
    // Then sort by priority (descending - lower number = higher priority)
    const priorityA = a.priority ? (PRIORITY_ORDER[a.priority] ?? 99) : 99;
    const priorityB = b.priority ? (PRIORITY_ORDER[b.priority] ?? 99) : 99;
    return priorityA - priorityB;
  });
}

async function getTasks() {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfDay.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Today's tasks (explicitly due today, not done)
  const todayTasksRaw = await db.query.tasks.findMany({
    where: and(
      not(eq(schema.tasks.status, "done")),
      gte(schema.tasks.dueDate, startOfDay),
      lte(schema.tasks.dueDate, endOfDay)
    ),
  });

  // This week's tasks (for calendar)
  const weekTasks = await db.query.tasks.findMany({
    where: and(
      not(eq(schema.tasks.status, "done")),
      gte(schema.tasks.dueDate, startOfDay),
      lte(schema.tasks.dueDate, endOfWeek)
    ),
    orderBy: (tasks, { asc }) => [asc(tasks.dueDate), asc(tasks.dueTime)],
  });

  // Tomorrow's tasks (next section)
  const startOfTomorrow = new Date(endOfDay.getTime() + 1);
  const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
  const nextTasksRaw = await db.query.tasks.findMany({
    where: and(
      not(eq(schema.tasks.status, "done")),
      gte(schema.tasks.dueDate, startOfTomorrow),
      lte(schema.tasks.dueDate, endOfTomorrow)
    ),
  });

  // Apply custom sorting: Status (asc) then Priority (desc)
  const todayTasks = sortTasks(todayTasksRaw);
  const nextTasks = sortTasks(nextTasksRaw);

  return { todayTasks, weekTasks, nextTasks };
}

async function getProjects() {
  return await db.query.projects.findMany({
    orderBy: (projects, { asc }) => [asc(projects.name)],
  });
}

// Serialize dates to ISO strings for client components
function serializeTasks<T extends { dueDate: Date | null }>(tasks: T[]) {
  return tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }));
}

export default async function Home() {
  const { todayTasks, weekTasks, nextTasks } = await getTasks();
  const projects = await getProjects();

  return (
    <AppLayout>
      <Dashboard
        todayTasks={serializeTasks(todayTasks)}
        weekTasks={serializeTasks(weekTasks)}
        nextTasks={serializeTasks(nextTasks)}
        projects={projects}
      />
    </AppLayout>
  );
}
