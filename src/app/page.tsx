import { db, schema } from "@/lib/db";
import { Dashboard } from "@/components/Dashboard";
import { AppLayout } from "@/components/AppLayout";
import { eq, and, gte, lte } from "drizzle-orm";
import { startOfWeek, endOfWeek } from "date-fns";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

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

  // Today's tasks (explicitly due today, including done - they show grayed out)
  const todayTasksRaw = await db.query.tasks.findMany({
    where: and(
      gte(schema.tasks.dueDate, startOfDay),
      lte(schema.tasks.dueDate, endOfDay)
    ),
    with: {
      project: true,
      organization: true,
    },
    orderBy: (tasks, { asc }) => [asc(tasks.dueTime)],
  });

  // Tomorrow's tasks (next section, including done)
  const startOfTomorrow = new Date(endOfDay.getTime() + 1);
  const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
  const nextTasksRaw = await db.query.tasks.findMany({
    where: and(
      gte(schema.tasks.dueDate, startOfTomorrow),
      lte(schema.tasks.dueDate, endOfTomorrow)
    ),
    with: {
      project: true,
      organization: true,
    },
    orderBy: (tasks, { asc }) => [asc(tasks.dueTime)],
  });

  // Apply custom sorting: Status (asc) then Priority (desc)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const todayTasks = sortTasks(todayTasksRaw as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nextTasks = sortTasks(nextTasksRaw as any);

  // Calendar tasks: Fetch the entire week (Sunday-Saturday) so drag-and-drop works
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const weekTasksRaw = await db.query.tasks.findMany({
    where: and(
      gte(schema.tasks.dueDate, weekStart),
      lte(schema.tasks.dueDate, weekEnd)
    ),
    with: {
      project: true,
      organization: true,
    },
    orderBy: (tasks, { asc }) => [asc(tasks.dueDate), asc(tasks.dueTime)],
  });

  return { todayTasks, weekTasks: weekTasksRaw, nextTasks };
}

async function getProjects() {
  return await db.query.projects.findMany({
    with: {
      organization: true,
    },
    orderBy: (projects, { asc }) => [asc(projects.name)],
  });
}

async function getOrganizations() {
  try {
    return await db.query.organizations.findMany({
      orderBy: (organizations, { asc }) => [asc(organizations.name)],
    });
  } catch (error) {
    console.log("Organizations table not found, returning empty array:", (error as Error).message);
    return [];
  }
}

// Serialize dates to ISO strings for client components
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeTasks(tasks: any[]) {
  return tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }));
}

export default async function Home() {
  const { todayTasks, weekTasks, nextTasks } = await getTasks();
  const projects = await getProjects();
  const organizations = await getOrganizations();

  return (
    <AppLayout>
      <Dashboard
        todayTasks={serializeTasks(todayTasks)}
        weekTasks={serializeTasks(weekTasks)}
        nextTasks={serializeTasks(nextTasks)}
        projects={projects}
        organizations={organizations}
      />
    </AppLayout>
  );
}
