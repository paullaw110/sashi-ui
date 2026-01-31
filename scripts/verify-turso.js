#!/usr/bin/env node

const { createClient } = require("@libsql/client");
require("dotenv").config({ path: ".env.local" });

async function verifyTurso() {
  console.log("🔍 Verifying Turso database...");

  const tursoClient = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  try {
    // Count total tasks
    const totalTasks = await tursoClient.execute("SELECT COUNT(*) as count FROM tasks");
    console.log(`📊 Total tasks: ${totalTasks.rows[0].count}`);

    // Count by status
    const statusCounts = await tursoClient.execute(`
      SELECT status, COUNT(*) as count 
      FROM tasks 
      GROUP BY status 
      ORDER BY count DESC
    `);
    console.log(`\n📈 Tasks by status:`);
    statusCounts.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });

    // Count tasks with notion_id
    const notionTasks = await tursoClient.execute(
      "SELECT COUNT(*) as count FROM tasks WHERE notion_id IS NOT NULL"
    );
    console.log(`\n🔗 Tasks with Notion ID: ${notionTasks.rows[0].count}`);

    // Sample recent tasks
    const recentTasks = await tursoClient.execute(`
      SELECT id, name, status, priority, due_date, notion_id 
      FROM tasks 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    
    console.log(`\n📋 Recent tasks:`);
    recentTasks.rows.forEach(task => {
      const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date';
      console.log(`  - ${task.name} [${task.status}] ${task.priority || 'no priority'} (Due: ${dueDate})`);
    });

    // Check for any issues
    const orphanTasks = await tursoClient.execute(`
      SELECT COUNT(*) as count 
      FROM tasks 
      WHERE project_id IS NOT NULL 
        AND project_id NOT IN (SELECT id FROM projects)
    `);
    
    if (orphanTasks.rows[0].count > 0) {
      console.log(`\n⚠️  Warning: ${orphanTasks.rows[0].count} tasks reference non-existent projects`);
    } else {
      console.log(`\n✅ No orphan tasks found`);
    }

  } catch (error) {
    console.error("❌ Verification failed:", error);
  }
}

verifyTurso();