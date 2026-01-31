/**
 * Local SQLite database service for Tauri offline support
 * Uses tauri-plugin-sql to interact with local SQLite
 */

export type LocalTask = {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  due: string | null;
  duration: number | null;
  notes: string | null;
  organization_id: string | null;
  project_id: string | null;
  parent_id: string | null;
  prd: string | null;
  prd_context: string | null;
  prd_chat: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_dirty: number; // SQLite uses 0/1 for booleans
};

export type LocalOrganization = {
  id: string;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_dirty: number;
};

export type LocalProject = {
  id: string;
  name: string;
  organization_id: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
  synced_at: string | null;
  is_dirty: number;
};

export type LocalTag = {
  id: string;
  name: string;
  color: string | null;
  created_at: string;
};

export type LocalTaskTag = {
  task_id: string;
  tag_id: string;
};

export type SyncLogEntry = {
  id: number;
  entity_type: string;
  entity_id: string;
  action: "create" | "update" | "delete";
  synced_at: string | null;
  error: string | null;
};

// Check if we're in Tauri
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

// Get the database instance
async function getDb() {
  if (!isTauri()) {
    throw new Error("Local database only available in Tauri");
  }

  const Database = (await import("@tauri-apps/plugin-sql")).default;
  return await Database.load("sqlite:sashi.db");
}

// ============ Tasks ============

export async function getAllTasks(): Promise<LocalTask[]> {
  const db = await getDb();
  return db.select<LocalTask[]>("SELECT * FROM tasks ORDER BY created_at DESC");
}

export async function getTask(id: string): Promise<LocalTask | null> {
  const db = await getDb();
  const results = await db.select<LocalTask[]>(
    "SELECT * FROM tasks WHERE id = ?",
    [id]
  );
  return results[0] || null;
}

export async function getDirtyTasks(): Promise<LocalTask[]> {
  const db = await getDb();
  return db.select<LocalTask[]>("SELECT * FROM tasks WHERE is_dirty = 1");
}

export async function upsertTask(task: Partial<LocalTask> & { id: string }): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO tasks (id, name, status, priority, due, duration, notes, organization_id, project_id, parent_id, prd, prd_context, prd_chat, created_at, updated_at, synced_at, is_dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = COALESCE(excluded.name, name),
       status = COALESCE(excluded.status, status),
       priority = excluded.priority,
       due = excluded.due,
       duration = excluded.duration,
       notes = excluded.notes,
       organization_id = excluded.organization_id,
       project_id = excluded.project_id,
       parent_id = excluded.parent_id,
       prd = excluded.prd,
       prd_context = excluded.prd_context,
       prd_chat = excluded.prd_chat,
       updated_at = excluded.updated_at,
       synced_at = excluded.synced_at,
       is_dirty = excluded.is_dirty`,
    [
      task.id,
      task.name || "Untitled",
      task.status || "todo",
      task.priority || null,
      task.due || null,
      task.duration || null,
      task.notes || null,
      task.organization_id || null,
      task.project_id || null,
      task.parent_id || null,
      task.prd || null,
      task.prd_context || null,
      task.prd_chat || null,
      task.created_at || now,
      task.updated_at || now,
      task.synced_at || null,
      task.is_dirty ?? 1,
    ]
  );
}

export async function markTaskSynced(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE tasks SET is_dirty = 0, synced_at = ? WHERE id = ?",
    [now, id]
  );
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM tasks WHERE id = ?", [id]);
}

// ============ Organizations ============

export async function getAllOrganizations(): Promise<LocalOrganization[]> {
  const db = await getDb();
  return db.select<LocalOrganization[]>(
    "SELECT * FROM organizations ORDER BY name"
  );
}

export async function getDirtyOrganizations(): Promise<LocalOrganization[]> {
  const db = await getDb();
  return db.select<LocalOrganization[]>(
    "SELECT * FROM organizations WHERE is_dirty = 1"
  );
}

export async function upsertOrganization(
  org: Partial<LocalOrganization> & { id: string }
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO organizations (id, name, icon, created_at, updated_at, synced_at, is_dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = COALESCE(excluded.name, name),
       icon = excluded.icon,
       updated_at = excluded.updated_at,
       synced_at = excluded.synced_at,
       is_dirty = excluded.is_dirty`,
    [
      org.id,
      org.name || "Untitled",
      org.icon || null,
      org.created_at || now,
      org.updated_at || now,
      org.synced_at || null,
      org.is_dirty ?? 1,
    ]
  );
}

export async function markOrganizationSynced(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE organizations SET is_dirty = 0, synced_at = ? WHERE id = ?",
    [now, id]
  );
}

// ============ Projects ============

export async function getAllProjects(): Promise<LocalProject[]> {
  const db = await getDb();
  return db.select<LocalProject[]>("SELECT * FROM projects ORDER BY name");
}

export async function getDirtyProjects(): Promise<LocalProject[]> {
  const db = await getDb();
  return db.select<LocalProject[]>("SELECT * FROM projects WHERE is_dirty = 1");
}

export async function upsertProject(
  project: Partial<LocalProject> & { id: string }
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO projects (id, name, organization_id, icon, created_at, updated_at, synced_at, is_dirty)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = COALESCE(excluded.name, name),
       organization_id = excluded.organization_id,
       icon = excluded.icon,
       updated_at = excluded.updated_at,
       synced_at = excluded.synced_at,
       is_dirty = excluded.is_dirty`,
    [
      project.id,
      project.name || "Untitled",
      project.organization_id || null,
      project.icon || null,
      project.created_at || now,
      project.updated_at || now,
      project.synced_at || null,
      project.is_dirty ?? 1,
    ]
  );
}

export async function markProjectSynced(id: string): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();
  await db.execute(
    "UPDATE projects SET is_dirty = 0, synced_at = ? WHERE id = ?",
    [now, id]
  );
}

// ============ Tags ============

export async function getAllTags(): Promise<LocalTag[]> {
  const db = await getDb();
  return db.select<LocalTag[]>("SELECT * FROM tags ORDER BY name");
}

export async function upsertTag(
  tag: Partial<LocalTag> & { id: string }
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO tags (id, name, color, created_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = COALESCE(excluded.name, name),
       color = excluded.color`,
    [tag.id, tag.name || "Untitled", tag.color || null, tag.created_at || now]
  );
}

// ============ Task Tags ============

export async function getTaskTags(taskId: string): Promise<LocalTaskTag[]> {
  const db = await getDb();
  return db.select<LocalTaskTag[]>(
    "SELECT * FROM task_tags WHERE task_id = ?",
    [taskId]
  );
}

export async function setTaskTags(
  taskId: string,
  tagIds: string[]
): Promise<void> {
  const db = await getDb();
  
  // Clear existing tags
  await db.execute("DELETE FROM task_tags WHERE task_id = ?", [taskId]);
  
  // Insert new tags
  for (const tagId of tagIds) {
    await db.execute(
      "INSERT INTO task_tags (task_id, tag_id) VALUES (?, ?)",
      [taskId, tagId]
    );
  }
}

// ============ Sync Log ============

export async function logSync(
  entityType: string,
  entityId: string,
  action: "create" | "update" | "delete",
  error?: string
): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO sync_log (entity_type, entity_id, action, synced_at, error)
     VALUES (?, ?, ?, ?, ?)`,
    [entityType, entityId, action, error ? null : now, error || null]
  );
}

// ============ Counts ============

export async function getPendingChangesCount(): Promise<number> {
  const db = await getDb();
  const result = await db.select<{ count: number }[]>(`
    SELECT 
      (SELECT COUNT(*) FROM tasks WHERE is_dirty = 1) +
      (SELECT COUNT(*) FROM organizations WHERE is_dirty = 1) +
      (SELECT COUNT(*) FROM projects WHERE is_dirty = 1) as count
  `);
  return result[0]?.count || 0;
}

// ============ Bulk Operations ============

export async function clearAllData(): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM task_tags");
  await db.execute("DELETE FROM tasks");
  await db.execute("DELETE FROM projects");
  await db.execute("DELETE FROM organizations");
  await db.execute("DELETE FROM tags");
  await db.execute("DELETE FROM sync_log");
}

export async function bulkUpsertTasks(tasks: Array<Partial<LocalTask> & { id: string }>): Promise<void> {
  for (const task of tasks) {
    await upsertTask({ ...task, is_dirty: 0 });
  }
}

export async function bulkUpsertOrganizations(orgs: Array<Partial<LocalOrganization> & { id: string }>): Promise<void> {
  for (const org of orgs) {
    await upsertOrganization({ ...org, is_dirty: 0 });
  }
}

export async function bulkUpsertProjects(projects: Array<Partial<LocalProject> & { id: string }>): Promise<void> {
  for (const project of projects) {
    await upsertProject({ ...project, is_dirty: 0 });
  }
}

export async function bulkUpsertTags(tags: Array<Partial<LocalTag> & { id: string }>): Promise<void> {
  for (const tag of tags) {
    await upsertTag(tag);
  }
}
