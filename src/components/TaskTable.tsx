"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";
import { InlineOrgProjectCell } from "./InlineOrgProjectCell";
import { InlineSelectCell, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./InlineSelectCell";
import { InlineTagCell } from "./InlineTagCell";

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  tags: string | null;
  relationalTags?: Tag[];
  subtaskCount?: number;
  subtaskDoneCount?: number;
  project?: SchemaProject | null;
  organization?: Organization | null;
};

interface TaskTableProps {
  tasks: Task[];
  projects: SchemaProject[];
  organizations?: Organization[];
  title: string;
  showFilters?: boolean;
  hideDueColumn?: boolean;
  onTaskClick?: (task: Task) => void;
  onNewTask?: () => void;
  onTaskUpdate?: (taskId: string, field: string, value: string | null) => Promise<void>;
  editingTaskId?: string | null;
  onEditingComplete?: () => void;
}

function getStatusBadge(status: string) {
  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    done: {
      label: "Done",
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/30"
    },
    in_progress: {
      label: "In Progress",
      bg: "bg-blue-500/15",
      text: "text-blue-400",
      border: "border-blue-500/30"
    },
    waiting: {
      label: "Waiting",
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30"
    },
    not_started: {
      label: "Not Started",
      bg: "bg-[var(--bg-surface)]",
      text: "text-[var(--text-quaternary)]",
      border: "border-[var(--border-default)]"
    },
  };

  const { label, bg, text, border } = config[status] || config.not_started;

  return (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded border whitespace-nowrap",
      bg, text, border
    )}>
      {label}
    </span>
  );
}

function getPriorityBadge(priority: string | null) {
  if (!priority) return null;

  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    "non-negotiable": {
      label: "Non-Negotiable",
      bg: "bg-red-500/15",
      text: "text-red-400",
      border: "border-red-500/30"
    },
    critical: {
      label: "Critical",
      bg: "bg-rose-500/15",
      text: "text-rose-400",
      border: "border-rose-500/30"
    },
    high: {
      label: "High",
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30"
    },
    medium: {
      label: "Medium",
      bg: "bg-yellow-500/15",
      text: "text-yellow-400",
      border: "border-yellow-500/30"
    },
    low: {
      label: "Low",
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/30"
    },
  };

  const { label, bg, text, border } = config[priority] || {
    label: priority,
    bg: "bg-[var(--bg-surface)]",
    text: "text-[var(--text-quaternary)]",
    border: "border-[var(--border-default)]"
  };

  return (
    <span className={cn(
      "text-xs px-2 py-0.5 rounded border whitespace-nowrap",
      bg, text, border
    )}>
      {label}
    </span>
  );
}

export function TaskTable({
  tasks,
  projects,
  organizations = [],
  title,
  showFilters = true,
  hideDueColumn = false,
  onTaskClick,
  onNewTask,
  onTaskUpdate,
  editingTaskId,
  onEditingComplete,
}: TaskTableProps) {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus and select text when editingTaskId changes
  useEffect(() => {
    if (editingTaskId && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingTaskId]);

  // Simple inline update handler - just call the parent
  const handleInlineUpdate = useCallback(async (taskId: string, field: string, value: string | null) => {
    if (onTaskUpdate) {
      await onTaskUpdate(taskId, field, value);
    }
  }, [onTaskUpdate]);

  // Handle name edit completion
  const handleNameBlur = useCallback(async (taskId: string, newName: string) => {
    const trimmedName = newName.trim() || "Task";
    if (onTaskUpdate) {
      await onTaskUpdate(taskId, "name", trimmedName);
    }
    onEditingComplete?.();
  }, [onTaskUpdate, onEditingComplete]);

  const handleNameKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, taskId: string) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    } else if (e.key === "Escape") {
      onEditingComplete?.();
    }
  }, [onEditingComplete]);

  const filteredTasks = tasks.filter((task) => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2 sm:gap-3">
          <h2 className="font-display text-lg text-[var(--text-primary)]">{title}</h2>
          <span className="text-xs text-[var(--text-quaternary)]">{filteredTasks.length}</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          {showFilters && (
            <>
              <select
                value={filterStatus || ""}
                onChange={(e) => setFilterStatus(e.target.value || null)}
                className="text-xs text-[var(--text-quaternary)] bg-transparent border border-[var(--border-default)] px-2 py-1 rounded hover:border-[var(--border-strong)] focus:outline-none transition-colors"
              >
                <option value="">Status</option>
                <option value="not_started">Todo</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting">Waiting</option>
                <option value="done">Done</option>
              </select>
              <select
                value={filterPriority || ""}
                onChange={(e) => setFilterPriority(e.target.value || null)}
                className="hidden sm:block text-xs text-[var(--text-quaternary)] bg-transparent border border-[var(--border-default)] px-2 py-1 rounded hover:border-[var(--border-strong)] focus:outline-none transition-colors"
              >
                <option value="">Priority</option>
                <option value="non-negotiable">Non-Negotiable</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </>
          )}
          <button
            onClick={onNewTask}
            className="flex items-center gap-1 text-xs text-[var(--text-quaternary)] hover:text-[var(--text-secondary)] px-2 py-1 rounded hover:bg-[var(--bg-surface)] transition-colors"
          >
            <Plus size={12} />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2 border-b border-[var(--border-subtle)] text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest">
        <div className="flex-1 min-w-0">Task</div>
        <div className="w-24 sm:w-28 hidden md:block">Organization</div>
        <div className="w-24 sm:w-28 hidden lg:block">Project</div>
        <div className="w-28 hidden xl:block">Tags</div>
        <div className="w-24 sm:w-28 hidden sm:block">Priority</div>
        <div className="w-24 sm:w-28 hidden sm:block">Status</div>
        {!hideDueColumn && <div className="w-16 sm:w-20 text-right">Due</div>}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#161616]">
        {filteredTasks.slice(0, 25).map((task) => {
          const isEditing = editingTaskId === task.id;

          return (
          <div
            key={task.id}
            onClick={() => !isEditing && onTaskClick?.(task)}
            className={cn(
              "flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2.5 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors",
              task.status === "done" && "opacity-40"
            )}
          >
            {/* Name - editable when isEditing */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              {isEditing ? (
                <input
                  ref={nameInputRef}
                  type="text"
                  defaultValue={task.name}
                  onBlur={(e) => handleNameBlur(task.id, e.target.value)}
                  onKeyDown={(e) => handleNameKeyDown(e, task.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 text-sm font-medium bg-transparent border-none outline-none text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--border-strong)] rounded px-1 -mx-1"
                />
              ) : (
                <span className={cn(
                  "text-sm truncate font-medium",
                  task.status === "done" ? "text-[var(--text-quaternary)] line-through" : "text-[var(--text-primary)]"
                )}>
                  {task.name}
                </span>
              )}
              {!isEditing && task.subtaskCount != null && task.subtaskCount > 0 && (
                <span className="shrink-0 text-[10px] text-[var(--text-quaternary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">
                  {task.subtaskDoneCount}/{task.subtaskCount}
                </span>
              )}
            </div>

            {/* Organization - hidden on mobile/tablet */}
            <div
              className="w-24 sm:w-28 shrink-0 hidden md:block"
              onClick={(e) => e.stopPropagation()}
            >
              <InlineOrgProjectCell
                type="organization"
                taskId={task.id}
                currentId={task.organizationId}
                currentName={task.organization?.name || null}
                organizations={organizations}
                projects={projects}
                onUpdate={handleInlineUpdate}
              />
            </div>

            {/* Project - hidden on mobile/tablet/small desktop */}
            <div
              className="w-24 sm:w-28 shrink-0 hidden lg:block"
              onClick={(e) => e.stopPropagation()}
            >
              <InlineOrgProjectCell
                type="project"
                taskId={task.id}
                currentId={task.projectId}
                currentName={task.project?.name || null}
                organizationId={task.organizationId}
                organizations={organizations}
                projects={projects}
                onUpdate={handleInlineUpdate}
              />
            </div>

            {/* Tags - hidden on smaller screens */}
            <div
              className="w-28 shrink-0 hidden xl:block"
              onClick={(e) => e.stopPropagation()}
            >
              <InlineTagCell
                taskId={task.id}
                currentTags={task.relationalTags || []}
              />
            </div>

            {/* Priority - hidden on mobile */}
            <div
              className="w-24 sm:w-28 shrink-0 hidden sm:block"
              onClick={(e) => e.stopPropagation()}
            >
              <InlineSelectCell
                type="priority"
                taskId={task.id}
                currentValue={task.priority}
                options={PRIORITY_OPTIONS}
                onUpdate={handleInlineUpdate}
              />
            </div>

            {/* Status - hidden on mobile */}
            <div
              className="w-24 sm:w-28 shrink-0 hidden sm:block"
              onClick={(e) => e.stopPropagation()}
            >
              <InlineSelectCell
                type="status"
                taskId={task.id}
                currentValue={task.status}
                options={STATUS_OPTIONS}
                onUpdate={handleInlineUpdate}
                allowClear={false}
              />
            </div>

            {/* Date */}
            {!hideDueColumn && (
              <span className="w-16 sm:w-20 shrink-0 text-xs text-[var(--text-quaternary)] text-right">
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : ""
                }
              </span>
            )}
          </div>
        );
        })}

        {filteredTasks.length === 0 && (
          <div className="px-4 py-10 text-center text-[var(--text-quaternary)] text-xs">
            No tasks
          </div>
        )}

        {filteredTasks.length > 25 && (
          <div className="px-4 py-2 text-center text-[#333] text-[10px]">
            +{filteredTasks.length - 25} more
          </div>
        )}

        {/* Inline add task row */}
        {onNewTask && (
          <div
            onClick={onNewTask}
            className="flex items-center gap-4 sm:gap-6 px-3 sm:px-4 py-2.5 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)]"
          >
            <div className="flex items-center gap-1.5">
              <Plus size={14} />
              <span className="text-sm">New task</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
