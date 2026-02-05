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
  // PRD fields
  prd: text("prd"), // Generated PRD markdown
  prdContext: text("prd_context"), // Original context dump
  prdChat: text("prd_chat"), // JSON: clarification Q&A history
  parentId: text("parent_id").references(() => tasks.id, { onDelete: "cascade" }), // For subtasks - cascade delete when parent is deleted
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// Calendar Events (separate from tasks)
export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  location: text("location"),

  // Timing
  startDate: integer("start_date", { mode: "timestamp_ms" }).notNull(),
  startTime: text("start_time"), // HH:mm format, null for all-day
  endTime: text("end_time"), // HH:mm format
  isAllDay: integer("is_all_day", { mode: "boolean" }).default(false),

  // Appearance
  color: text("color").default("#3b82f6"), // Blue default (different from task lime)

  // Recurrence (RRULE format - RFC 5545)
  recurrenceRule: text("recurrence_rule"), // e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR"
  recurrenceEnd: integer("recurrence_end", { mode: "timestamp_ms" }), // End date for series

  // Metadata
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

// Event Exceptions (for editing single occurrences of recurring events)
export const eventExceptions = sqliteTable("event_exceptions", {
  id: text("id").primaryKey(),
  eventId: text("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),

  // Which occurrence this exception applies to
  originalDate: integer("original_date", { mode: "timestamp_ms" }).notNull(),

  // Exception type
  isCancelled: integer("is_cancelled", { mode: "boolean" }).default(false),

  // Modified values (null = use parent event values)
  modifiedName: text("modified_name"),
  modifiedStartTime: text("modified_start_time"),
  modifiedEndTime: text("modified_end_time"),
  modifiedLocation: text("modified_location"),

  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
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
  parent: one(tasks, {
    fields: [tasks.parentId],
    references: [tasks.id],
    relationName: "subtasks",
  }),
  subtasks: many(tasks, {
    relationName: "subtasks",
  }),
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

export const eventsRelations = relations(events, ({ many }) => ({
  exceptions: many(eventExceptions),
}));

export const eventExceptionsRelations = relations(eventExceptions, ({ one }) => ({
  event: one(events, {
    fields: [eventExceptions.eventId],
    references: [events.id],
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
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventException = typeof eventExceptions.$inferSelect;
export type NewEventException = typeof eventExceptions.$inferInsert;

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

// Sashi Reports (morning/nightly summaries)
export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // 'morning' | 'nightly'
  date: text("date").notNull(), // YYYY-MM-DD
  title: text("title").notNull(),
  content: text("content").notNull(), // Markdown content
  metadata: text("metadata"), // JSON: task counts, highlights, etc.
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;

// ============================================
// MISSION CONTROL - Multi-Agent System
// ============================================

// Agents table - Sashi, Kira, Mu, etc.
export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(), // e.g., "sashi", "kira", "mu"
  name: text("name").notNull(), // Display name: "Sashi", "Kira", "Mu"
  role: text("role").notNull(), // "Squad Lead", "Researcher", "Designer"
  description: text("description"), // Longer description of capabilities
  avatar: text("avatar"), // emoji like "⚡" or image URL
  status: text("status").notNull().default("idle"), // idle | active | blocked
  sessionKey: text("session_key").notNull(), // e.g., "agent:kira:main"
  model: text("model"), // e.g., "anthropic/claude-sonnet-4-20250514"
  currentTaskId: text("current_task_id").references(() => tasks.id),
  lastActiveAt: integer("last_active_at", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Task comments - threaded discussions on tasks
export const taskComments = sqliteTable("task_comments", {
  id: text("id").primaryKey(),
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull().references(() => agents.id),
  content: text("content").notNull(), // The comment text (supports @mentions)
  attachments: text("attachments"), // JSON array of document/file references
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Activity feed - real-time log of all agent actions
export const activityFeed = sqliteTable("activity_feed", {
  id: text("id").primaryKey(),
  type: text("type").notNull(), // task_created | task_updated | comment_added | agent_status_changed | task_assigned
  agentId: text("agent_id").references(() => agents.id),
  taskId: text("task_id").references(() => tasks.id),
  message: text("message").notNull(), // Human-readable activity description
  metadata: text("metadata"), // JSON for extra context
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Notifications - @mentions and alerts for agents
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(),
  mentionedAgentId: text("mentioned_agent_id").notNull().references(() => agents.id),
  fromAgentId: text("from_agent_id").references(() => agents.id),
  taskId: text("task_id").references(() => tasks.id),
  commentId: text("comment_id").references(() => taskComments.id),
  content: text("content").notNull(), // Notification message
  delivered: integer("delivered", { mode: "boolean" }).notNull().default(false),
  read: integer("read", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Task subscriptions - auto-subscribe agents to task threads
export const taskSubscriptions = sqliteTable("task_subscriptions", {
  taskId: text("task_id").notNull().references(() => tasks.id, { onDelete: "cascade" }),
  agentId: text("agent_id").notNull().references(() => agents.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

// Relations for Mission Control tables
export const agentsRelations = relations(agents, ({ one, many }) => ({
  currentTask: one(tasks, {
    fields: [agents.currentTaskId],
    references: [tasks.id],
  }),
  comments: many(taskComments),
  activities: many(activityFeed),
  notifications: many(notifications, { relationName: "mentionedAgent" }),
  sentNotifications: many(notifications, { relationName: "fromAgent" }),
  subscriptions: many(taskSubscriptions),
}));

export const taskCommentsRelations = relations(taskComments, ({ one }) => ({
  task: one(tasks, {
    fields: [taskComments.taskId],
    references: [tasks.id],
  }),
  agent: one(agents, {
    fields: [taskComments.agentId],
    references: [agents.id],
  }),
}));

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
  agent: one(agents, {
    fields: [activityFeed.agentId],
    references: [agents.id],
  }),
  task: one(tasks, {
    fields: [activityFeed.taskId],
    references: [tasks.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  mentionedAgent: one(agents, {
    fields: [notifications.mentionedAgentId],
    references: [agents.id],
    relationName: "mentionedAgent",
  }),
  fromAgent: one(agents, {
    fields: [notifications.fromAgentId],
    references: [agents.id],
    relationName: "fromAgent",
  }),
  task: one(tasks, {
    fields: [notifications.taskId],
    references: [tasks.id],
  }),
  comment: one(taskComments, {
    fields: [notifications.commentId],
    references: [taskComments.id],
  }),
}));

export const taskSubscriptionsRelations = relations(taskSubscriptions, ({ one }) => ({
  task: one(tasks, {
    fields: [taskSubscriptions.taskId],
    references: [tasks.id],
  }),
  agent: one(agents, {
    fields: [taskSubscriptions.agentId],
    references: [agents.id],
  }),
}));

// Type exports for Mission Control
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type TaskComment = typeof taskComments.$inferSelect;
export type NewTaskComment = typeof taskComments.$inferInsert;
export type ActivityFeedItem = typeof activityFeed.$inferSelect;
export type NewActivityFeedItem = typeof activityFeed.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type TaskSubscription = typeof taskSubscriptions.$inferSelect;
export type NewTaskSubscription = typeof taskSubscriptions.$inferInsert;
