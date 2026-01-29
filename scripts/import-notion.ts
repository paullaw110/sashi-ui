/**
 * Import tasks from Notion to Sashi DB
 * Run with: npx tsx scripts/import-notion.ts
 */

import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const NOTION_KEY = fs.readFileSync(
  path.join(process.env.HOME!, ".config/notion/api_key"),
  "utf-8"
).trim();

const NOTION_DATABASE_ID = "03720dbd-bbf8-4f75-9f64-520e3da0d167";

const dbPath = path.join(process.cwd(), "db", "sashi.db");

// Ensure db directory exists
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    type TEXT,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    project_id TEXT REFERENCES projects(id),
    priority TEXT,
    status TEXT NOT NULL DEFAULT 'not_started',
    due_date INTEGER,
    due_time TEXT,
    tags TEXT,
    notion_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_notion_id ON tasks(notion_id);
`);

interface NotionTask {
  id: string;
  properties: {
    "Task name"?: { title: { plain_text: string }[] };
    Status?: { status: { name: string } };
    Priority?: { select: { name: string } | null };
    Due?: { date: { start: string; end?: string } | null };
    "Project Tag"?: { relation: { id: string }[] };
  };
}

function mapStatus(notionStatus: string): string {
  const lower = notionStatus.toLowerCase();
  if (lower.includes("done") || lower.includes("complete")) return "done";
  if (lower.includes("progress") || lower.includes("doing")) return "in_progress";
  if (lower.includes("waiting")) return "waiting";
  return "not_started";
}

function mapPriority(notionPriority: string | null): string | null {
  if (!notionPriority) return null;
  const lower = notionPriority.toLowerCase();
  if (lower.includes("critical") || lower.includes("urgent")) return "critical";
  if (lower.includes("high")) return "high";
  if (lower.includes("medium")) return "medium";
  if (lower.includes("low")) return "low";
  return notionPriority.toLowerCase();
}

async function fetchAllTasks(): Promise<NotionTask[]> {
  const tasks: NotionTask[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: any = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;

    const response = await fetch(
      `https://api.notion.com/v1/data_sources/${NOTION_DATABASE_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_KEY}`,
          "Notion-Version": "2025-09-03",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(`Notion API error: ${response.status} ${await response.text()}`);
    }

    const data = await response.json();
    tasks.push(...data.results);
    hasMore = data.has_more;
    startCursor = data.next_cursor;

    console.log(`Fetched ${tasks.length} tasks...`);
  }

  return tasks;
}

async function importTasks() {
  console.log("Fetching tasks from Notion...");
  const notionTasks = await fetchAllTasks();
  console.log(`Found ${notionTasks.length} tasks in Notion`);

  const insertTask = db.prepare(`
    INSERT OR REPLACE INTO tasks (id, name, project_id, priority, status, due_date, due_time, tags, notion_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = Date.now();
  let imported = 0;
  let skipped = 0;

  for (const task of notionTasks) {
    const name = task.properties["Task name"]?.title?.[0]?.plain_text;
    if (!name) {
      skipped++;
      continue;
    }

    const status = task.properties.Status?.status?.name || "Not Started";
    const priority = task.properties.Priority?.select?.name || null;
    const due = task.properties.Due?.date?.start;

    let dueDate: number | null = null;
    let dueTime: string | null = null;

    if (due) {
      const parsed = new Date(due);
      dueDate = parsed.getTime();
      // Check if time is included (ISO string with T)
      if (due.includes("T")) {
        dueTime = due.split("T")[1].substring(0, 5); // HH:mm
      }
    }

    insertTask.run(
      crypto.randomUUID(),
      name,
      null, // project_id - we'd need to map these
      mapPriority(priority),
      mapStatus(status),
      dueDate,
      dueTime,
      null, // tags
      task.id,
      now,
      now
    );

    imported++;
  }

  console.log(`\nImport complete!`);
  console.log(`  Imported: ${imported}`);
  console.log(`  Skipped: ${skipped}`);
}

importTasks().catch(console.error);
