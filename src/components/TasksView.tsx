"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { List, Calendar, Plus, Circle, CheckCircle2, Clock, AlertCircle, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskSidePanel } from "./TaskSidePanel";
import { MonthCalendar } from "./MonthCalendar";
import { format } from "date-fns";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null  // ISO string from server;
  dueTime: string | null;
  tags: string | null;
  description?: string | null;
};

type Project = {
  id: string;
  name: string;
  color: string | null;
};

interface TasksViewProps {
  tasks: Task[];
  projects: Project[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={14} className="text-green-500" />;
    case "in_progress":
      return <Clock size={14} className="text-blue-400" />;
    case "waiting":
      return <AlertCircle size={14} className="text-amber-400" />;
    default:
      return <Circle size={14} className="text-[#404040]" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "done":
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
          Done
        </span>
      );
    case "in_progress":
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
          In Progress
        </span>
      );
    case "waiting":
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
          Waiting
        </span>
      );
    default:
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] text-[#525252] border border-[#222]">
          Todo
        </span>
      );
  }
}

function getPriorityBadge(priority: string | null) {
  if (!priority) return <span className="text-[10px] text-[#333]">—</span>;
  
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
    bg: "bg-[#1a1a1a]", 
    text: "text-[#525252]", 
    border: "border-[#222]" 
  };
  
  return (
    <span className={cn(
      "text-[10px] px-2 py-0.5 rounded border whitespace-nowrap",
      bg, text, border
    )}>
      {label}
    </span>
  );
}

export function TasksView({ tasks, projects }: TasksViewProps) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("list");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filterStatus && task.status !== filterStatus) return false;
      
      // Priority filter
      if (filterPriority && task.priority !== filterPriority) return false;
      
      // Search filter - search in both name and description
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDescription) return false;
      }
      
      return true;
    });
  }, [tasks, filterStatus, filterPriority, searchQuery]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsPanelOpen(true);
  }, []);

  const handleNewTask = useCallback(() => {
    setSelectedTask(null);
    setIsCreating(true);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedTask(null);
    setIsCreating(false);
  }, []);

  const handleSave = useCallback(async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await fetch(`/api/tasks/${taskData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
    } else {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
    }
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }, [router]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }, [router]);

  const cycleStatus = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const statuses = ["not_started", "in_progress", "waiting", "done"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    handleStatusChange(task.id, nextStatus);
  };

  const handleTaskMove = useCallback(async (taskId: string, newDate: Date) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: newDate.toISOString() }),
    });
    router.refresh();
  }, [router]);

  const handleTasksMove = useCallback(async (taskIds: string[], newDate: Date) => {
    // Move all selected tasks in parallel
    await Promise.all(
      taskIds.map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: newDate.toISOString() }),
        })
      )
    );
    router.refresh();
  }, [router]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilterStatus(null);
    setFilterPriority(null);
  }, []);

  const hasActiveFilters = searchQuery || filterStatus || filterPriority;

  return (
    <div className={cn("flex flex-col", view === "calendar" && "h-[calc(100vh-180px)]")}>
      {/* Header with view toggle and filters */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-[#111] rounded-lg p-0.5 border border-[#1a1a1a]">
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                view === "list"
                  ? "bg-[#1c1c1c] text-[#f5f5f5]"
                  : "text-[#525252] hover:text-[#737373]"
              )}
            >
              <List size={14} />
              List
            </button>
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                view === "calendar"
                  ? "bg-[#1c1c1c] text-[#f5f5f5]"
                  : "text-[#525252] hover:text-[#737373]"
              )}
            >
              <Calendar size={14} />
              Calendar
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#404040]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-[11px] text-[#e5e5e5] bg-[#111] border border-[#222] pl-9 pr-3 py-1.5 rounded hover:border-[#333] focus:border-[#404040] focus:outline-none transition-colors w-48"
            />
          </div>

          {/* Filters */}
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="text-[11px] text-[#525252] bg-[#111] border border-[#222] px-2 py-1.5 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="">All Status</option>
            <option value="not_started">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filterPriority || ""}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="text-[11px] text-[#525252] bg-[#111] border border-[#222] px-2 py-1.5 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="">All Priority</option>
            <option value="non-negotiable">Non-Negotiable</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-[#737373] border border-[#222] hover:border-[#333] px-2 py-1.5 rounded transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        <button 
          onClick={handleNewTask}
          className="flex items-center gap-1.5 text-[11px] text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="bg-[#111] rounded-lg border border-[#1a1a1a]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#1a1a1a] text-[10px] text-[#404040] uppercase tracking-widest">
            <div className="col-span-6">Task</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Due</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-[#161616]">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={cn(
                  "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#161616] cursor-pointer transition-colors items-center",
                  task.status === "done" && "opacity-40"
                )}
              >
                <div className="col-span-6 flex items-center gap-3">
                  <button
                    onClick={(e) => cycleStatus(e, task)}
                    className="hover:opacity-70 transition-opacity shrink-0"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <span className={cn(
                    "text-xs truncate",
                    task.status === "done" ? "text-[#404040] line-through" : "text-[#e5e5e5]"
                  )}>
                    {task.name}
                  </span>
                </div>
                <div className="col-span-2">
                  {getPriorityBadge(task.priority)}
                </div>
                <div className="col-span-2">
                  {getStatusBadge(task.status)}
                </div>
                <div className="col-span-2">
                  <span className="text-[11px] text-[#404040]">
                    {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "—"}
                  </span>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="px-4 py-12 text-center text-[#404040] text-xs">
                No tasks found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#1a1a1a]">
            <span className="text-[10px] text-[#333]">
              {filteredTasks.length} task{filteredTasks.length !== 1 && "s"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <MonthCalendar 
            tasks={filteredTasks} 
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
            onTasksMove={handleTasksMove}
          />
        </div>
      )}

      <TaskSidePanel
        task={selectedTask}
        projects={projects}
        isOpen={isPanelOpen}
        isCreating={isCreating}
        onClose={handleClosePanel}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
