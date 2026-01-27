import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

// Create Turso client
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || "file:./db/sashi.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });

// Initialize tables
const initSQL = `
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
  duration INTEGER,
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
`;

// Run init on module load (for Turso we need to do this differently)
async function initDb() {
  const statements = initSQL.split(';').filter(s => s.trim());
  for (const statement of statements) {
    if (statement.trim() && !statement.trim().startsWith('--')) {
      await client.execute(statement);
    }
  }
  
  // Migrations - add columns that might not exist
  const migrations = [
    "ALTER TABLE tasks ADD COLUMN duration INTEGER",
  ];
  
  for (const migration of migrations) {
    try {
      await client.execute(migration);
    } catch {
      // Column likely already exists, ignore
    }
  }
}

// Initialize on first import
initDb().catch(console.error);

export { schema };
