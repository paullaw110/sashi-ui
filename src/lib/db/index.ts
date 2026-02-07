import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client/http";
import * as schema from "./schema";

// Validate required environment variables
if (!process.env.TURSO_DATABASE_URL) {
  throw new Error("TURSO_DATABASE_URL environment variable is required");
}

if (!process.env.TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_AUTH_TOKEN environment variable is required");
}

// Create Turso client (cloud-only configuration)
const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Initialize tables
const initSQL = `
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at INTEGER NOT NULL
);

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
  description TEXT,
  notion_id TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS inbox_items (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sashi_queue (
  id TEXT PRIMARY KEY,
  task TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  session_key TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sashi_status (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  state TEXT NOT NULL DEFAULT 'idle',
  task TEXT,
  started_at INTEGER,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);

-- Migration: Add duration column if it doesn't exist (SQLite workaround)
-- This will fail silently if column already exists
CREATE INDEX IF NOT EXISTS idx_inbox_type ON inbox_items(type);
CREATE INDEX IF NOT EXISTS idx_sashi_status ON sashi_queue(status);

CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY,
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  location TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  website_url TEXT,
  website_screenshot TEXT,
  google_rating INTEGER,
  review_count INTEGER,
  top_reviews TEXT,
  pagespeed_score INTEGER,
  mobile_friendly INTEGER,
  has_ssl INTEGER,
  tech_stack TEXT,
  qualification_score INTEGER,
  issues_detected TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  brief_url TEXT,
  preview_site_url TEXT,
  outreach_sent_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_industry ON leads(industry);
CREATE INDEX IF NOT EXISTS idx_leads_score ON leads(qualification_score);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_date ON reports(date);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(type);

-- Mission Control: Agents table
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  description TEXT,
  avatar TEXT,
  status TEXT NOT NULL DEFAULT 'idle',
  session_key TEXT NOT NULL,
  model TEXT,
  current_task_id TEXT,
  last_active_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Mission Control: Task comments (threaded discussions)
CREATE TABLE IF NOT EXISTS task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

-- Mission Control: Activity feed
CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  agent_id TEXT,
  task_id TEXT,
  message TEXT NOT NULL,
  metadata TEXT,
  created_at INTEGER NOT NULL
);

-- Mission Control: Notifications (@mentions)
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  mentioned_agent_id TEXT NOT NULL,
  from_agent_id TEXT,
  task_id TEXT,
  comment_id TEXT,
  content TEXT NOT NULL,
  delivered INTEGER NOT NULL DEFAULT 0,
  read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (mentioned_agent_id) REFERENCES agents(id),
  FOREIGN KEY (from_agent_id) REFERENCES agents(id)
);

-- Mission Control: Task subscriptions
CREATE TABLE IF NOT EXISTS task_subscriptions (
  task_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (task_id, agent_id),
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(mentioned_agent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_delivered ON notifications(delivered);

CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_date INTEGER NOT NULL,
  start_time TEXT,
  end_time TEXT,
  is_all_day INTEGER DEFAULT 0,
  color TEXT DEFAULT '#EFFF83',
  recurrence_rule TEXT,
  recurrence_end INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS event_exceptions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  original_date INTEGER NOT NULL,
  is_cancelled INTEGER DEFAULT 0,
  modified_name TEXT,
  modified_start_time TEXT,
  modified_end_time TEXT,
  modified_location TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_event ON event_exceptions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_exceptions_date ON event_exceptions(original_date);

-- Idea Gauntlet: History of idea evaluations
CREATE TABLE IF NOT EXISTS idea_gauntlet_runs (
  id TEXT PRIMARY KEY,
  idea TEXT NOT NULL,
  result TEXT NOT NULL,
  verdict TEXT NOT NULL,
  confidence INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_idea_gauntlet_runs_created ON idea_gauntlet_runs(created_at);
CREATE INDEX IF NOT EXISTS idx_idea_gauntlet_runs_verdict ON idea_gauntlet_runs(verdict);
`;

// Database connection validation and initialization
async function validateConnection() {
  try {
    // Test connection with a simple query
    await client.execute("SELECT 1");
    console.log("✅ Successfully connected to Turso database");
    return true;
  } catch (error) {
    console.error("❌ Failed to connect to Turso database:", error);
    
    // Provide helpful error messages based on common issues
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("authentication")) {
      throw new Error(
        "Database authentication failed. Please verify your TURSO_AUTH_TOKEN is correct and hasn't expired."
      );
    } else if (errorMessage.includes("not found") || errorMessage.includes("404")) {
      throw new Error(
        "Database not found. Please verify your TURSO_DATABASE_URL is correct and the database exists."
      );
    } else if (errorMessage.includes("timeout") || errorMessage.includes("ENOTFOUND")) {
      throw new Error(
        "Unable to connect to database. Please check your internet connection and try again."
      );
    } else {
      throw new Error(
        `Database connection failed: ${errorMessage}. Please check your Turso configuration.`
      );
    }
  }
}

// Initialize database schema
async function initDb() {
  console.log("🔄 Initializing Turso database...");

  try {
    // First validate connection
    await validateConnection();

    // Enable foreign keys (disabled by default in SQLite)
    await client.execute("PRAGMA foreign_keys = ON");
    
    // Execute schema initialization statements
    const statements = initSQL.split(';').filter(s => s.trim());
    for (const statement of statements) {
      if (statement.trim() && !statement.trim().startsWith('--')) {
        await client.execute(statement);
      }
    }
    
    // Handle schema migrations safely - add missing columns
    const migrations = [
      {
        name: "Add duration to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN duration INTEGER DEFAULT NULL"
      },
      {
        name: "Add organization_id to tasks", 
        sql: "ALTER TABLE tasks ADD COLUMN organization_id TEXT DEFAULT NULL"
      },
      {
        name: "Add organization_id to projects",
        sql: "ALTER TABLE projects ADD COLUMN organization_id TEXT DEFAULT NULL"  
      },
      {
        name: "Create tasks organization index",
        sql: "CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id)"
      },
      {
        name: "Create projects organization index", 
        sql: "CREATE INDEX IF NOT EXISTS idx_projects_organization ON projects(organization_id)"
      },
      // Icon fields
      {
        name: "Add icon to organizations",
        sql: "ALTER TABLE organizations ADD COLUMN icon TEXT DEFAULT NULL"
      },
      {
        name: "Add icon to projects",
        sql: "ALTER TABLE projects ADD COLUMN icon TEXT DEFAULT NULL"
      },
      // PRD feature fields
      {
        name: "Add prd to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN prd TEXT DEFAULT NULL"
      },
      {
        name: "Add prd_context to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN prd_context TEXT DEFAULT NULL"
      },
      {
        name: "Add prd_chat to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN prd_chat TEXT DEFAULT NULL"
      },
      {
        name: "Add parent_id to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN parent_id TEXT DEFAULT NULL"
      },
      {
        name: "Create tasks parent index",
        sql: "CREATE INDEX IF NOT EXISTS idx_tasks_parent ON tasks(parent_id)"
      },
      // Tags and task tags tables
      {
        name: "Create tags table",
        sql: `CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          color TEXT,
          created_at INTEGER NOT NULL
        )`
      },
      {
        name: "Create task_tags table",
        sql: `CREATE TABLE IF NOT EXISTS task_tags (
          task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
          tag_id TEXT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
          created_at INTEGER NOT NULL,
          PRIMARY KEY (task_id, tag_id)
        )`
      },
      {
        name: "Create task_tags task index",
        sql: "CREATE INDEX IF NOT EXISTS idx_task_tags_task ON task_tags(task_id)"
      },
      {
        name: "Create task_tags tag index",
        sql: "CREATE INDEX IF NOT EXISTS idx_task_tags_tag ON task_tags(tag_id)"
      },
      // Context fields for better PRD generation
      {
        name: "Add github_url to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN github_url TEXT DEFAULT NULL"
      },
      {
        name: "Add figma_url to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN figma_url TEXT DEFAULT NULL"
      },
      {
        name: "Add tech_stack to projects",
        sql: "ALTER TABLE projects ADD COLUMN tech_stack TEXT DEFAULT NULL"
      },
      {
        name: "Add assigned_agent_id to tasks",
        sql: "ALTER TABLE tasks ADD COLUMN assigned_agent_id TEXT DEFAULT NULL"
      }
    ];
    
    for (const migration of migrations) {
      try {
        await client.execute(migration.sql);
        console.log(`✅ ${migration.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes("duplicate column name") || errorMessage.includes("already exists")) {
          console.log(`⏭️  ${migration.name} (already exists)`);
        } else {
          console.warn(`⚠️  ${migration.name} failed:`, errorMessage);
        }
        // Continue with other migrations
      }
    }
    
    console.log("✅ Database initialization complete");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Database initialization failed:", errorMessage);
    throw error;
  }
}

// Initialize on first import with proper error handling
initDb().catch((error) => {
  console.error("Failed to initialize database:", error.message);
  // Don't exit the process in Next.js, but log the error clearly
  if (typeof window === 'undefined') {
    console.error("Application will not function properly without a working database connection.");
  }
});

export { schema };
