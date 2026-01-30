"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Circle, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";
import { InlineOrgProjectCell } from "./InlineOrgProjectCell";
import { InlineSelectCell, STATUS_OPTIONS, PRIORITY_OPTIONS } from "./InlineSelectCell";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;  // ISO string from server
  dueTime: string | null;
  tags: string | null;
  project?: SchemaProject | null;
  organization?: Organization | null;
};

interface TaskTableProps {
  tasks: Task[];
  projects: SchemaProject[];
  organizations?: Organization[];
  title: string;
  showFilters?: boolean;
  hideDueColumn?: boolean; // Hide the Due column (useful when tasks are already grouped by date)
  defaultDueDate?: string; // ISO date string for new tasks (e.g., "today" section uses today's date)
  onTaskClick?: (task: Task) => void;
  onNewTask?: () => void;
  onStatusChange?: (taskId: string, status: string) => void;
  onTaskUpdate?: (taskId: string, field: string, value: string | null) => Promise<void>;
  onInlineCreate?: (name: string, dueDate?: string) => Promise<Task | null>;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={14} className="text-[var(--text-tertiary)]" />;
    case "in_progress":
      return <Clock size={14} className="text-[var(--text-secondary)]" />;
    case "waiting":
      return <AlertCircle size={14} className="text-[var(--text-tertiary)]" />;
    default:
      return <Circle size={14} className="text-[var(--text-quaternary)]" />;
  }
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
  if (!priority) return <span className="text-xs text-[var(--text-quaternary)]">—</span>;
  
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
  defaultDueDate,
  onTaskClick,
  onNewTask,
  onStatusChange,
  onTaskUpdate,
  onInlineCreate,
}: TaskTableProps) {
  const router = useRouter();
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskName, setNewTaskName] = useState("");
  
  // Optimistic tasks - shown immediately while API call happens
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

  // Clear optimistic tasks when real tasks change (server data arrived)
  const prevTasksRef = useRef(tasks);
  useEffect(() => {
    if (tasks !== prevTasksRef.current && optimisticTasks.length > 0) {
      // Server data arrived, clear optimistic tasks
      setOptimisticTasks([]);
    }
    prevTasksRef.current = tasks;
  }, [tasks, optimisticTasks.length]);

  // Handler for inline updates (org/project)
  const handleInlineUpdate = useCallback(async (taskId: string, field: string, value: string | null) => {
    if (onTaskUpdate) {
      await onTaskUpdate(taskId, field, value);
    } else {
      // Fallback: direct API call
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      router.refresh();
    }
  }, [onTaskUpdate, router]);

  // Handler for inline create with optimistic update
  const handleInlineCreate = useCallback(async () => {
    if (!newTaskName.trim() || !onInlineCreate) return;
    
    const taskName = newTaskName.trim();
    setNewTaskName(""); // Clear input immediately
    
    // Create optimistic task
    const optimisticTask: Task = {
      id: `optimistic-${Date.now()}`,
      name: taskName,
      status: "not_started",
      priority: null,
      projectId: null,
      organizationId: null,
      dueDate: defaultDueDate ? `${defaultDueDate}T12:00:00.000Z` : null,
      dueTime: null,
      tags: null,
      project: null,
      organization: null,
    };
    
    // Add to optimistic list immediately
    setOptimisticTasks(prev => [...prev, optimisticTask]);
    
    setIsCreating(true);
    try {
      await onInlineCreate(taskName, defaultDueDate || undefined);
      // Don't manually clear - let the useEffect clear when tasks prop changes
    } catch {
      // Remove optimistic task on error
      setOptimisticTasks(prev => prev.filter(t => t.id !== optimisticTask.id));
    } finally {
      setIsCreating(false);
    }
  }, [newTaskName, onInlineCreate, defaultDueDate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInlineCreate();
    }
    if (e.key === "Escape") {
      setNewTaskName("");
    }
  }, [handleInlineCreate]);

  // Merge real tasks with optimistic tasks
  const allTasks = [...tasks, ...optimisticTasks];
  
  const filteredTasks = allTasks.filter((task) => {
    if (filterStatus && task.status !== filterStatus) return false;
    if (filterPriority && task.priority !== filterPriority) return false;
    return true;
  });

  const cycleStatus = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const statuses = ["not_started", "in_progress", "waiting", "done"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    onStatusChange?.(task.id, nextStatus);
  };

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
      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 border-b border-[var(--border-subtle)] text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest">
        <div className="w-5"></div>
        <div className="flex-1 min-w-0">Task</div>
        <div className="w-20 sm:w-24 hidden md:block">Organization</div>
        <div className="w-20 sm:w-24 hidden lg:block">Project</div>
        <div className="w-20 sm:w-24 hidden sm:block">Priority</div>
        <div className="w-20 sm:w-24 hidden sm:block">Status</div>
        {!hideDueColumn && <div className="w-12 sm:w-16 text-right">Due</div>}
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#161616]">
        {filteredTasks.slice(0, 25).map((task) => {
          const isOptimistic = task.id.startsWith("optimistic-");
          
          return (
          <div
            key={task.id}
            onClick={() => !isOptimistic && onTaskClick?.(task)}
            className={cn(
              "flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors",
              task.status === "done" && "opacity-40",
              isOptimistic && "opacity-60 animate-pulse pointer-events-none"
            )}
          >
            {/* Status */}
            <button
              onClick={(e) => cycleStatus(e, task)}
              className="w-5 shrink-0 hover:opacity-70 transition-opacity"
            >
              {getStatusIcon(task.status)}
            </button>

            {/* Name */}
            <span className={cn(
              "flex-1 min-w-0 text-sm truncate font-medium",
              task.status === "done" ? "text-[var(--text-quaternary)] line-through" : "text-[var(--text-primary)]"
            )}>
              {task.name}
            </span>

            {/* Organization - hidden on mobile/tablet */}
            <div 
              className="w-20 sm:w-24 shrink-0 hidden md:block"
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
              className="w-20 sm:w-24 shrink-0 hidden lg:block"
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

            {/* Priority - hidden on mobile */}
            <div 
              className="w-20 sm:w-24 shrink-0 hidden sm:block"
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
              className="w-20 sm:w-24 shrink-0 hidden sm:block"
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
              <span className="w-12 sm:w-16 shrink-0 text-xs text-[var(--text-quaternary)] text-right">
                {task.dueDate 
                  ? new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "—"
                }
              </span>
            )}
          </div>
        );
        })}

        {filteredTasks.length === 0 && !onInlineCreate && (
          <div className="px-4 py-10 text-center text-[var(--text-quaternary)] text-xs">
            No tasks
          </div>
        )}

        {filteredTasks.length > 25 && (
          <div className="px-4 py-2 text-center text-[#333] text-[10px]">
            +{filteredTasks.length - 25} more
          </div>
        )}

        {/* Inline create row */}
        {onInlineCreate && (
          <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 hover:bg-[var(--bg-surface)] transition-colors">
            <div className="w-5 shrink-0 flex items-center justify-center">
              <Plus size={14} className="text-[var(--text-quaternary)]" />
            </div>
            <input
              type="text"
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (newTaskName.trim()) handleInlineCreate();
              }}
              placeholder="New task"
              disabled={isCreating}
              className="flex-1 min-w-0 text-sm bg-transparent border-none outline-none placeholder:text-[var(--text-quaternary)] text-[var(--text-primary)] disabled:opacity-50"
            />
            {/* Spacer columns to match layout */}
            <div className="w-20 sm:w-24 shrink-0 hidden md:block" />
            <div className="w-20 sm:w-24 shrink-0 hidden lg:block" />
            <div className="w-20 sm:w-24 shrink-0 hidden sm:block" />
            <div className="w-20 sm:w-24 shrink-0 hidden sm:block" />
            {!hideDueColumn && <div className="w-12 sm:w-16 shrink-0" />}
          </div>
        )}
      </div>
    </div>
  );
}
