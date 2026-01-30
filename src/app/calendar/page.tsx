export const metadata = { title: "Calendar" };

import { db, schema } from "@/lib/db";
import { CalendarView } from "@/components/CalendarView";
import { AppLayout } from "@/components/AppLayout";
import { gte, lte, and, not, eq } from "drizzle-orm";
import { startOfWeek, endOfWeek, addWeeks, subWeeks } from "date-fns";

async function getTasks() {
  const now = new Date();
  // Get tasks for a wider range to handle navigation
  const rangeStart = subWeeks(startOfWeek(now, { weekStartsOn: 0 }), 4);
  const rangeEnd = addWeeks(endOfWeek(now, { weekStartsOn: 0 }), 8);

  const tasks = await db.query.tasks.findMany({
    where: and(
      gte(schema.tasks.dueDate, rangeStart),
      lte(schema.tasks.dueDate, rangeEnd)
    ),
    orderBy: (tasks, { asc }) => [asc(tasks.dueDate), asc(tasks.dueTime)],
  });

  return tasks;
}

async function getProjects() {
  return await db.query.projects.findMany({
    orderBy: (projects, { asc }) => [asc(projects.name)],
  });
}

async function getOrganizations() {
  return await db.query.organizations.findMany({
    orderBy: (organizations, { asc }) => [asc(organizations.name)],
  });
}

// Serialize dates to ISO strings for client components
function serializeTasks<T extends { dueDate: Date | null }>(tasks: T[]) {
  return tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
  }));
}

export default async function CalendarPage() {
  const tasks = await getTasks();
  const projects = await getProjects();
  const organizations = await getOrganizations();

  return (
    <AppLayout 
      title="Calendar" 
      subtitle="Plan your week"
    >
      <CalendarView
        tasks={serializeTasks(tasks)}
        projects={projects}
        organizations={organizations}
      />
    </AppLayout>
  );
}
