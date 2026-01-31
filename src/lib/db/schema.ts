import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  icon: text("icon"), // emoji like "🏢" or "🏠"
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color"),
  icon: text("icon"), // emoji like "🚀" or "📊"
  type: text("type"), // client, personal, work
  organizationId: text("organization_id").references(() => organizations.id),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Tags for tasks
export const tags = sqliteTable("tags", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  color: text("color"), // hex color like "#FF5733"
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Junction table for task-tag relationships
export const taskTags = sqliteTable("task_tags", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  tagId: text("tag_id").notNull().references(() => tags.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  projectId: text("project_id").references(() => projects.id),
  organizationId: text("organization_id").references(() => organizations.id),
  priority: text("priority"), // critical, high, medium, low
  status: text("status").notNull().default("not_started"), // not_started, in_progress, waiting, done
  dueDate: integer("due_date", { mode: "timestamp_ms" }),
  dueTime: text("due_time"), // HH:mm format
  duration: integer("duration"), // duration in minutes (e.g., 30, 60, 90)
  tags: text("tags"), // JSON array stored as text
  description: text("description"), // HTML content from rich editor
  notionId: text("notion_id"), // for import tracking
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"), // HTML content from rich editor
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const inboxItems = sqliteTable("inbox_items", {
  id: text("id").primaryKey(),
  content: text("content").notNull(),
  type: text("type").notNull(), // note, bookmark, idea, task
  url: text("url"),
  metadata: text("metadata"), // JSON
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const sashiQueue = sqliteTable("sashi_queue", {
  id: text("id").primaryKey(),
  task: text("task").notNull(),
  status: text("status").notNull().default("queued"), // queued, in_progress, done, blocked
  sessionKey: text("session_key"),
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Sashi's current status (single row table)
export const sashiStatus = sqliteTable("sashi_status", {
  id: text("id").primaryKey().default("singleton"), // Always "singleton" - single row
  state: text("state").notNull().default("idle"), // idle, working, waiting
  task: text("task"), // What Sashi is currently working on
  startedAt: integer("started_at", { mode: "timestamp_ms" }),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  organization: one(organizations, {
    fields: [tasks.organizationId],
    references: [organizations.id],
  }),
  taskTags: many(taskTags),
}));

export const tagsRelations = relations(tags, ({ many }) => ({
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, {
    fields: [taskTags.taskId],
    references: [tasks.id],
  }),
  tag: one(tags, {
    fields: [taskTags.tagId],
    references: [tags.id],
  }),
}));

// Type exports
export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type InboxItem = typeof inboxItems.$inferSelect;
export type NewInboxItem = typeof inboxItems.$inferInsert;
export type SashiQueueItem = typeof sashiQueue.$inferSelect;
export type NewSashiQueueItem = typeof sashiQueue.$inferInsert;
export type SashiStatus = typeof sashiStatus.$inferSelect;
export type NewSashiStatus = typeof sashiStatus.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
export type TaskTag = typeof taskTags.$inferSelect;
export type NewTaskTag = typeof taskTags.$inferInsert;

// SuperLandings Leads
export const leads = sqliteTable("leads", {
  id: text("id").primaryKey(),
  businessName: text("business_name").notNull(),
  industry: text("industry").notNull(), // dentist, plumber, restaurant, etc.
  location: text("location").notNull(), // City, State
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  websiteUrl: text("website_url"),
  websiteScreenshot: text("website_screenshot"), // file path
  googleRating: integer("google_rating"), // stored as 45 for 4.5
  reviewCount: integer("review_count"),
  topReviews: text("top_reviews"), // JSON array of review strings
  pagespeedScore: integer("pagespeed_score"), // 0-100
  mobileFriendly: integer("mobile_friendly", { mode: "boolean" }),
  hasSSL: integer("has_ssl", { mode: "boolean" }),
  techStack: text("tech_stack"), // JSON array: ["Wix", "WordPress"]
  qualificationScore: integer("qualification_score"), // calculated total
  issuesDetected: text("issues_detected"), // JSON array: ["Slow", "Not mobile friendly"]
  status: text("status").notNull().default("new"), // new, approved, brief_created, site_built, outreach_sent, converted, lost
  notes: text("notes"),
  briefUrl: text("brief_url"),
  previewSiteUrl: text("preview_site_url"),
  outreachSentAt: integer("outreach_sent_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
