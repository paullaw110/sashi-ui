import { db, schema } from "@/lib/db";
import { eq, and, count, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { OrganizationPageClient } from "./OrganizationPageClient";

export const dynamic = "force-dynamic";

async function getOrganization(id: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(schema.organizations.id, id),
  });
  return org;
}

async function getProjects(organizationId: string) {
  const projects = await db.query.projects.findMany({
    where: eq(schema.projects.organizationId, organizationId),
  });
  
  // Get task counts for each project
  const projectsWithCounts = await Promise.all(
    projects.map(async (project) => {
      const [{ total }] = await db
        .select({ total: count() })
        .from(schema.tasks)
        .where(eq(schema.tasks.projectId, project.id));
      
      const [{ completed }] = await db
        .select({ completed: count() })
        .from(schema.tasks)
        .where(
          and(
            eq(schema.tasks.projectId, project.id),
            eq(schema.tasks.status, "done")
          )
        );
      
      return {
        ...project,
        taskCount: total,
        completedCount: completed,
      };
    })
  );
  
  return projectsWithCounts;
}

async function getTasks(organizationId: string) {
  const tasks = await db.query.tasks.findMany({
    where: eq(schema.tasks.organizationId, organizationId),
    with: {
      project: true,
    },
    orderBy: (tasks, { desc }) => [desc(tasks.createdAt)],
  });
  return tasks;
}

async function getStats(organizationId: string) {
  const [{ projectCount }] = await db
    .select({ projectCount: count() })
    .from(schema.projects)
    .where(eq(schema.projects.organizationId, organizationId));

  const [{ taskCount }] = await db
    .select({ taskCount: count() })
    .from(schema.tasks)
    .where(eq(schema.tasks.organizationId, organizationId));

  const [{ completedCount }] = await db
    .select({ completedCount: count() })
    .from(schema.tasks)
    .where(
      and(
        eq(schema.tasks.organizationId, organizationId),
        eq(schema.tasks.status, "done")
      )
    );

  return {
    projectCount,
    taskCount,
    completedCount,
  };
}

export default async function OrganizationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const organization = await getOrganization(id);
  
  if (!organization) {
    notFound();
  }
  
  const [projects, tasks, stats] = await Promise.all([
    getProjects(id),
    getTasks(id),
    getStats(id),
  ]);
  
  // Get all projects for the task modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allProjects = await db.query.projects.findMany({
    with: { organization: true },
  }) as any;

  // Get all organizations for the task modal
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allOrganizations = await db.query.organizations.findMany() as any;
  
  // Serialize dates for client component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializedTasks = tasks.map(task => ({
    ...task,
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    createdAt: task.createdAt ? task.createdAt.toISOString() : undefined,
    updatedAt: task.updatedAt ? task.updatedAt.toISOString() : undefined,
  })) as any;
  
  const serializedOrg = {
    ...organization,
    createdAt: organization.createdAt,
  };
  
  const serializedProjects = projects.map(p => ({
    ...p,
    createdAt: p.createdAt,
  }));
  
  return (
    <OrganizationPageClient
      organization={serializedOrg}
      projects={serializedProjects}
      tasks={serializedTasks}
      stats={stats}
      allProjects={allProjects}
      allOrganizations={allOrganizations}
    />
  );
}
