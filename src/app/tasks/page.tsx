export const metadata = { title: "Tasks" };

import { db, schema } from "@/lib/db";
import { AppLayout } from "@/components/AppLayout";
import { TasksView } from "@/components/TasksView";
import { not, eq } from "drizzle-orm";

async function getTasks() {
  return await db.query.tasks.findMany({
    where: not(eq(schema.tasks.status, "done")),
    orderBy: (tasks, { asc, desc }) => [desc(tasks.priority), asc(tasks.dueDate)],
  });
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

export default async function TasksPage() {
  const tasks = await getTasks();
  const projects = await getProjects();

  return (
    <AppLayout title="Tasks" subtitle="All your tasks in one place">
      <TasksView tasks={serializeTasks(tasks)} projects={projects} />
    </AppLayout>
  );
}
