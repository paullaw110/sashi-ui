"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { MobileTaskRow } from "./MobileTaskRow";
import { MobileTaskDetail } from "./MobileTaskDetail";
import { PullToRefresh } from "./PullToRefresh";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: string | null;
  duration?: number | null;
  notes?: string | null;
  organizationId?: string | null;
  projectId?: string | null;
  organization?: { id: string; name: string; icon?: string | null } | null;
  project?: { id: string; name: string; icon?: string | null } | null;
  tags?: Array<{ id: string; name: string; color: string | null }>;
  [key: string]: unknown; // Allow additional properties
}

interface MobileTaskListProps {
  tasks: Task[];
  title?: string;
  onUpdateTask: (id: string, data: Partial<Task>) => void;
  onDeleteTask?: (id: string) => void;
  onAddTask?: () => void;
  onRefresh?: () => Promise<void>;
  showAddButton?: boolean;
  organizations?: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string; organizationId?: string | null }>;
}

export function MobileTaskList({
  tasks,
  title,
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onRefresh,
  showAddButton = true,
  organizations = [],
  projects = [],
}: MobileTaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const handleComplete = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task) {
      const newStatus = task.status === "done" ? "todo" : "done";
      onUpdateTask(id, { status: newStatus });
      
      // Haptic feedback
      if ("vibrate" in navigator) {
        navigator.vibrate(10);
      }
    }
  };

  const handleSelect = (task: Task) => {
    setSelectedTask(task);
    setDetailOpen(true);
  };

  const handleSaveTask = (data: Partial<Task>) => {
    if (selectedTask) {
      onUpdateTask(selectedTask.id, data);
    }
  };

  const handleDeleteTask = () => {
    if (selectedTask && onDeleteTask) {
      onDeleteTask(selectedTask.id);
      setDetailOpen(false);
      setSelectedTask(null);
    }
  };

  // Group tasks by status
  const todoTasks = tasks.filter((t) => t.status !== "done");
  const doneTasks = tasks.filter((t) => t.status === "done");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
          <h2 className="font-display text-lg text-[var(--text-primary)]">
            {title}
          </h2>
          <span className="text-sm text-[var(--text-tertiary)]">
            {todoTasks.length} tasks
          </span>
        </div>
      )}

      {/* Task list with pull to refresh */}
      <PullToRefresh 
        onRefresh={onRefresh || (async () => {})} 
        className="flex-1 overflow-y-auto"
      >
        {todoTasks.length === 0 && doneTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <p className="text-[var(--text-tertiary)]">No tasks yet</p>
            {showAddButton && onAddTask && (
              <button
                onClick={onAddTask}
                className="mt-3 text-sm text-[var(--accent)] hover:underline"
              >
                Add your first task
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Todo tasks */}
            <div className="divide-y divide-[var(--border-subtle)]">
              {todoTasks.map((task) => (
                <MobileTaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {/* Done tasks */}
            {doneTasks.length > 0 && (
              <div className="mt-4">
                <div className="px-4 py-2 text-xs font-medium text-[var(--text-quaternary)] uppercase tracking-wider">
                  Completed ({doneTasks.length})
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {doneTasks.map((task) => (
                    <MobileTaskRow
                      key={task.id}
                      task={task}
                      onComplete={handleComplete}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </PullToRefresh>

      {/* Floating Add Button */}
      {showAddButton && onAddTask && (
        <button
          onClick={onAddTask}
          className={cn(
            "fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg",
            "bg-[var(--accent)] text-[var(--bg-base)]",
            "flex items-center justify-center",
            "active:scale-95 transition-transform",
            "z-40"
          )}
        >
          <Plus size={24} />
        </button>
      )}

      {/* Task Detail Drawer */}
      <MobileTaskDetail
        task={selectedTask}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onSave={handleSaveTask}
        onDelete={onDeleteTask ? handleDeleteTask : undefined}
        organizations={organizations}
        projects={projects}
      />
    </div>
  );
}
