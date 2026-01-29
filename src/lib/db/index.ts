import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
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
