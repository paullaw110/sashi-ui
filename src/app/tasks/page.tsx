export const metadata = { title: "Tasks" };

import { db, schema } from "@/lib/db";
import { AppLayout } from "@/components/AppLayout";
import { TasksView } from "@/components/TasksView";
import { not, eq } from "drizzle-orm";

async function getTasks() {
  try {
    // Try with relations first (for migrated databases)
    return await db.query.tasks.findMany({
      where: not(eq(schema.tasks.status, "done")),
      with: {
        project: true,
        organization: true,
      },
      orderBy: (tasks, { asc, desc }) => [desc(tasks.priority), asc(tasks.dueDate)],
    });
  } catch (error) {
    console.log("Falling back to basic query (migration needed):", (error as Error).message);
    // Fallback for non-migrated databases
    const tasks = await db.query.tasks.findMany({
      where: not(eq(schema.tasks.status, "done")),
      orderBy: (tasks, { asc, desc }) => [desc(tasks.priority), asc(tasks.dueDate)],
    });
    
    // Add null organization fields for compatibility
    return tasks.map(task => ({
      ...task,
      organizationId: null,
      project: null,
      organization: null,
    }));
  }
}

async function getProjects() {
  try {
    // Try with organization relation
    return await db.query.projects.findMany({
      with: {
        organization: true,
      },
      orderBy: (projects, { asc }) => [asc(projects.name)],
    });
  } catch (error) {
    console.log("Falling back to basic projects query:", (error as Error).message);
    // Fallback for non-migrated databases
    const projects = await db.query.projects.findMany({
      orderBy: (projects, { asc }) => [asc(projects.name)],
    });
    
    // Add null organizationId for compatibility
    return projects.map(project => ({
      ...project,
      organizationId: null,
      organization: null,
    }));
  }
}

async function getOrganizations() {
  try {
    return await db.query.organizations.findMany({
      orderBy: (organizations, { asc }) => [asc(organizations.name)],
    });
  } catch (error) {
    console.log("Organizations table not found, returning empty array:", (error as Error).message);
    // Return empty array if organizations table doesn't exist yet
    return [];
  }
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
  const organizations = await getOrganizations();

  return (
    <AppLayout title="Tasks" subtitle="All your tasks in one place">
      <TasksView 
        tasks={serializeTasks(tasks)} 
        projects={projects} 
        organizations={organizations}
      />
    </AppLayout>
  );
}
