/**
 * Sync engine for Tauri offline support
 * Handles push (local -> server) and pull (server -> local) operations
 */

import * as db from "./db";
import { apiFetch } from "@/lib/api";

export type SyncResult = {
  success: boolean;
  pushed: {
    tasks: number;
    organizations: number;
    projects: number;
  };
  pulled: {
    tasks: number;
    organizations: number;
    projects: number;
    tags: number;
  };
  conflicts: number;
  errors: string[];
};

// Server types (from API responses)
type ServerTask = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  due: string | null;
  duration: number | null;
  notes: string | null;
  organizationId: string | null;
  projectId: string | null;
  parentId: string | null;
  prd: string | null;
  prdContext: string | null;
  prdChat: string | null;
  createdAt: string;
  updatedAt: string;
  tags?: Array<{ id: string; name: string; color: string | null }>;
};

type ServerOrganization = {
  id: string;
  name: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
};

type ServerProject = {
  id: string;
  name: string;
  organizationId: string | null;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
};

type ServerTag = {
  id: string;
  name: string;
  color: string | null;
  createdAt: string;
};

// Convert server format to local format
function serverTaskToLocal(task: ServerTask): db.LocalTask {
  return {
    id: task.id,
    name: task.name,
    status: task.status,
    priority: task.priority,
    due: task.due,
    duration: task.duration,
    notes: task.notes,
    organization_id: task.organizationId,
    project_id: task.projectId,
    parent_id: task.parentId,
    prd: task.prd,
    prd_context: task.prdContext,
    prd_chat: task.prdChat,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    synced_at: new Date().toISOString(),
    is_dirty: 0,
  };
}

function serverOrgToLocal(org: ServerOrganization): db.LocalOrganization {
  return {
    id: org.id,
    name: org.name,
    icon: org.icon,
    created_at: org.createdAt,
    updated_at: org.updatedAt,
    synced_at: new Date().toISOString(),
    is_dirty: 0,
  };
}

function serverProjectToLocal(project: ServerProject): db.LocalProject {
  return {
    id: project.id,
    name: project.name,
    organization_id: project.organizationId,
    icon: project.icon,
    created_at: project.createdAt,
    updated_at: project.updatedAt,
    synced_at: new Date().toISOString(),
    is_dirty: 0,
  };
}

function serverTagToLocal(tag: ServerTag): db.LocalTag {
  return {
    id: tag.id,
    name: tag.name,
    color: tag.color,
    created_at: tag.createdAt,
  };
}

// Convert local format to server format for push
function localTaskToServer(task: db.LocalTask): Partial<ServerTask> {
  return {
    id: task.id,
    name: task.name,
    status: task.status,
    priority: task.priority,
    due: task.due,
    duration: task.duration,
    notes: task.notes,
    organizationId: task.organization_id,
    projectId: task.project_id,
    parentId: task.parent_id,
    prd: task.prd,
    prdContext: task.prd_context,
    prdChat: task.prd_chat,
  };
}

function localOrgToServer(org: db.LocalOrganization): Partial<ServerOrganization> {
  return {
    id: org.id,
    name: org.name,
    icon: org.icon,
  };
}

function localProjectToServer(project: db.LocalProject): Partial<ServerProject> {
  return {
    id: project.id,
    name: project.name,
    organizationId: project.organization_id,
    icon: project.icon,
  };
}

/**
 * Push local dirty changes to the server
 */
async function pushChanges(): Promise<{
  tasks: number;
  organizations: number;
  projects: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let pushedTasks = 0;
  let pushedOrgs = 0;
  let pushedProjects = 0;

  // Push dirty tasks
  const dirtyTasks = await db.getDirtyTasks();
  for (const task of dirtyTasks) {
    try {
      const response = await apiFetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localTaskToServer(task)),
      });

      if (response.ok) {
        await db.markTaskSynced(task.id);
        await db.logSync("task", task.id, "update");
        pushedTasks++;
      } else if (response.status === 404) {
        // Task doesn't exist on server, create it
        const createResponse = await apiFetch(`/api/tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localTaskToServer(task)),
        });

        if (createResponse.ok) {
          await db.markTaskSynced(task.id);
          await db.logSync("task", task.id, "create");
          pushedTasks++;
        } else {
          const error = `Failed to create task ${task.id}: ${createResponse.status}`;
          errors.push(error);
          await db.logSync("task", task.id, "create", error);
        }
      } else {
        const error = `Failed to push task ${task.id}: ${response.status}`;
        errors.push(error);
        await db.logSync("task", task.id, "update", error);
      }
    } catch (e) {
      const error = `Network error pushing task ${task.id}: ${e}`;
      errors.push(error);
      await db.logSync("task", task.id, "update", error);
    }
  }

  // Push dirty organizations
  const dirtyOrgs = await db.getDirtyOrganizations();
  for (const org of dirtyOrgs) {
    try {
      const response = await apiFetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localOrgToServer(org)),
      });

      if (response.ok) {
        await db.markOrganizationSynced(org.id);
        await db.logSync("organization", org.id, "update");
        pushedOrgs++;
      } else if (response.status === 404) {
        const createResponse = await apiFetch(`/api/organizations`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localOrgToServer(org)),
        });

        if (createResponse.ok) {
          await db.markOrganizationSynced(org.id);
          await db.logSync("organization", org.id, "create");
          pushedOrgs++;
        } else {
          const error = `Failed to create org ${org.id}: ${createResponse.status}`;
          errors.push(error);
          await db.logSync("organization", org.id, "create", error);
        }
      } else {
        const error = `Failed to push org ${org.id}: ${response.status}`;
        errors.push(error);
        await db.logSync("organization", org.id, "update", error);
      }
    } catch (e) {
      const error = `Network error pushing org ${org.id}: ${e}`;
      errors.push(error);
      await db.logSync("organization", org.id, "update", error);
    }
  }

  // Push dirty projects
  const dirtyProjects = await db.getDirtyProjects();
  for (const project of dirtyProjects) {
    try {
      const response = await apiFetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(localProjectToServer(project)),
      });

      if (response.ok) {
        await db.markProjectSynced(project.id);
        await db.logSync("project", project.id, "update");
        pushedProjects++;
      } else if (response.status === 404) {
        const createResponse = await apiFetch(`/api/projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(localProjectToServer(project)),
        });

        if (createResponse.ok) {
          await db.markProjectSynced(project.id);
          await db.logSync("project", project.id, "create");
          pushedProjects++;
        } else {
          const error = `Failed to create project ${project.id}: ${createResponse.status}`;
          errors.push(error);
          await db.logSync("project", project.id, "create", error);
        }
      } else {
        const error = `Failed to push project ${project.id}: ${response.status}`;
        errors.push(error);
        await db.logSync("project", project.id, "update", error);
      }
    } catch (e) {
      const error = `Network error pushing project ${project.id}: ${e}`;
      errors.push(error);
      await db.logSync("project", project.id, "update", error);
    }
  }

  return {
    tasks: pushedTasks,
    organizations: pushedOrgs,
    projects: pushedProjects,
    errors,
  };
}

/**
 * Pull server data to local database
 * Uses "server wins" conflict resolution
 */
async function pullChanges(): Promise<{
  tasks: number;
  organizations: number;
  projects: number;
  tags: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let pulledTasks = 0;
  let pulledOrgs = 0;
  let pulledProjects = 0;
  let pulledTags = 0;

  // Pull organizations first (tasks depend on them)
  try {
    const response = await apiFetch(`/api/organizations`);
    if (response.ok) {
      const orgs: ServerOrganization[] = await response.json();
      for (const org of orgs) {
        const localOrg = serverOrgToLocal(org);
        
        // Check if we have local dirty changes
        const existing = await db.getAllOrganizations();
        const localExisting = existing.find(o => o.id === org.id);
        
        if (localExisting && localExisting.is_dirty === 1) {
          // Conflict: server wins, but we could implement merge logic here
          console.log(`Conflict on org ${org.id}: server wins`);
        }
        
        await db.upsertOrganization(localOrg);
        pulledOrgs++;
      }
    } else {
      errors.push(`Failed to pull organizations: ${response.status}`);
    }
  } catch (e) {
    errors.push(`Network error pulling organizations: ${e}`);
  }

  // Pull projects
  try {
    const response = await apiFetch(`/api/projects`);
    if (response.ok) {
      const projects: ServerProject[] = await response.json();
      for (const project of projects) {
        const localProject = serverProjectToLocal(project);
        await db.upsertProject(localProject);
        pulledProjects++;
      }
    } else {
      errors.push(`Failed to pull projects: ${response.status}`);
    }
  } catch (e) {
    errors.push(`Network error pulling projects: ${e}`);
  }

  // Pull tags
  try {
    const response = await apiFetch(`/api/tags`);
    if (response.ok) {
      const tags: ServerTag[] = await response.json();
      for (const tag of tags) {
        const localTag = serverTagToLocal(tag);
        await db.upsertTag(localTag);
        pulledTags++;
      }
    } else {
      errors.push(`Failed to pull tags: ${response.status}`);
    }
  } catch (e) {
    errors.push(`Network error pulling tags: ${e}`);
  }

  // Pull tasks (including tags)
  try {
    const response = await apiFetch(`/api/tasks`);
    if (response.ok) {
      const tasks: ServerTask[] = await response.json();
      for (const task of tasks) {
        const localTask = serverTaskToLocal(task);
        
        // Check for conflicts
        const existing = await db.getTask(task.id);
        if (existing && existing.is_dirty === 1) {
          // Conflict: server wins (could implement merge logic)
          console.log(`Conflict on task ${task.id}: server wins`);
        }
        
        await db.upsertTask(localTask);
        
        // Sync tags for this task
        if (task.tags) {
          await db.setTaskTags(task.id, task.tags.map(t => t.id));
        }
        
        pulledTasks++;
      }
    } else {
      errors.push(`Failed to pull tasks: ${response.status}`);
    }
  } catch (e) {
    errors.push(`Network error pulling tasks: ${e}`);
  }

  return {
    tasks: pulledTasks,
    organizations: pulledOrgs,
    projects: pulledProjects,
    tags: pulledTags,
    errors,
  };
}

/**
 * Full sync operation: push local changes, then pull server changes
 */
export async function fullSync(): Promise<SyncResult> {
  const result: SyncResult = {
    success: true,
    pushed: { tasks: 0, organizations: 0, projects: 0 },
    pulled: { tasks: 0, organizations: 0, projects: 0, tags: 0 },
    conflicts: 0,
    errors: [],
  };

  try {
    // Push first (send local changes to server)
    const pushResult = await pushChanges();
    result.pushed = {
      tasks: pushResult.tasks,
      organizations: pushResult.organizations,
      projects: pushResult.projects,
    };
    result.errors.push(...pushResult.errors);

    // Then pull (get server changes)
    const pullResult = await pullChanges();
    result.pulled = {
      tasks: pullResult.tasks,
      organizations: pullResult.organizations,
      projects: pullResult.projects,
      tags: pullResult.tags,
    };
    result.errors.push(...pullResult.errors);

    result.success = result.errors.length === 0;
  } catch (e) {
    result.success = false;
    result.errors.push(`Sync failed: ${e}`);
  }

  return result;
}

/**
 * Initial sync: clear local data and pull everything from server
 * Use this for first-time setup or to reset local state
 */
export async function initialSync(): Promise<SyncResult> {
  try {
    await db.clearAllData();
  } catch (e) {
    console.error("Failed to clear data for initial sync:", e);
  }

  return fullSync();
}

/**
 * Get pending changes count
 */
export async function getPendingCount(): Promise<number> {
  return db.getPendingChangesCount();
}
