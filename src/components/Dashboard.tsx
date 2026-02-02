"use client";

import { useState, useCallback, useMemo } from "react";
import { TaskTable } from "./TaskTable";
import { TimeWeekCalendar } from "./TimeWeekCalendar";
import { TaskDetailModal } from "./TaskDetailModal";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";
import { useTasks, useUpdateTask, useDeleteTask, useMoveTask, Task } from "@/lib/hooks/use-tasks";
import { useQueryClient } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, addDays, startOfWeek, endOfWeek } from "date-fns";

interface DashboardProps {
  todayTasks: Task[];
  weekTasks: Task[];
  nextTasks: Task[];
  projects: SchemaProject[];
  organizations?: Organization[];
}

// Type for tasks from TaskTable (slightly different schema)
type TableTask = Task & {
  project?: SchemaProject | null;
  organization?: Organization | null;
};

// Sort order for status (ascending: active work first, done last)
const STATUS_ORDER: Record<string, number> = {
  in_progress: 0,
  not_started: 1,
  waiting: 2,
  done: 3,
};

// Sort order for priority (descending: highest priority first)
const PRIORITY_ORDER: Record<string, number> = {
  "non-negotiable": 0,
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
};

function sortTasks<T extends { status: string; priority: string | null }>(tasks: T[]): T[] {
  return [...tasks].sort((a, b) => {
    // First sort by status (ascending)
    const statusA = STATUS_ORDER[a.status] ?? 99;
    const statusB = STATUS_ORDER[b.status] ?? 99;
    if (statusA !== statusB) return statusA - statusB;

    // Then sort by priority (descending - highest priority first)
    const priorityA = a.priority ? (PRIORITY_ORDER[a.priority] ?? 99) : 100;
    const priorityB = b.priority ? (PRIORITY_ORDER[b.priority] ?? 99) : 100;
    return priorityA - priorityB;
  });
}

export function Dashboard({ todayTasks, weekTasks, nextTasks, projects, organizations = [] }: DashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  // Combine server data as initial data for React Query
  // This dedupes tasks that appear in multiple lists
  const initialTasks = useMemo(() => {
    const taskMap = new Map<string, Task>();
    [...todayTasks, ...weekTasks, ...nextTasks].forEach(t => taskMap.set(t.id, t as Task));
    return Array.from(taskMap.values());
  }, [todayTasks, weekTasks, nextTasks]);

  // React Query for optimistic updates (cast to handle minor type differences)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: allTasks } = useTasks(initialTasks as any) as { data: Task[] | undefined };
  const queryClient = useQueryClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();

  // Filter tasks for today (due today, including done - they show grayed out)
  const filteredTodayTasks = useMemo((): TableTask[] => {
    if (!allTasks) return sortTasks(todayTasks as TableTask[]);
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    const filtered = allTasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= dayStart && due <= dayEnd;
    }) as TableTask[];

    return sortTasks(filtered);
  }, [allTasks, todayTasks]);

  // Filter tasks for next (tomorrow, including done)
  const filteredNextTasks = useMemo((): TableTask[] => {
    if (!allTasks) return sortTasks(nextTasks as TableTask[]);
    const tomorrow = addDays(new Date(), 1);
    const dayStart = startOfDay(tomorrow);
    const dayEnd = endOfDay(tomorrow);

    const filtered = allTasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= dayStart && due <= dayEnd;
    }) as TableTask[];

    return sortTasks(filtered);
  }, [allTasks, nextTasks]);

  // Filter tasks for week view
  const filteredWeekTasks = useMemo((): TableTask[] => {
    if (!allTasks) return weekTasks as TableTask[];
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
    
    return (allTasks.filter(task => {
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= weekStart && due <= weekEnd;
    }) as TableTask[]);
  }, [allTasks, weekTasks]);

  const handleTaskClick = useCallback((task: TableTask) => {
    setSelectedTask(task as Task);
    setIsCreating(false);
    setIsPanelOpen(true);
  }, []);

  const handleNewTask = useCallback((date?: Date) => {
    setSelectedTask(null);
    setIsCreating(true);
    setDefaultDate(date || null);
    setIsPanelOpen(true);
  }, []);

  // Create task via API and add to cache
  const handleInlineCreate = useCallback(async (name: string, dueDate?: string) => {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        dueDate: dueDate || null,
        status: "not_started"
      }),
    });

    const data = await response.json();
    const task = data.task || null;

    // Add to React Query cache so subsequent updates work
    if (task) {
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return [task];
        return [...old, task];
      });
    }

    return task;
  }, [queryClient]);

  // Create task inline and set editing mode
  const handleNewTodayTask = useCallback(async () => {
    const task = await handleInlineCreate("Task", format(new Date(), "yyyy-MM-dd"));
    if (task) {
      setEditingTaskId(task.id);
    }
  }, [handleInlineCreate]);

  const handleNewNextTask = useCallback(async () => {
    const task = await handleInlineCreate("Task", format(addDays(new Date(), 1), "yyyy-MM-dd"));
    if (task) {
      setEditingTaskId(task.id);
    }
  }, [handleInlineCreate]);

  const handleEditingComplete = useCallback(() => {
    setEditingTaskId(null);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedTask(null);
    setIsCreating(false);
    setDefaultDate(null);
  }, []);

  // Use React Query mutation for instant updates
  const handleSave = useCallback(async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await updateTask.mutateAsync(taskData as { id: string } & Partial<Task>);
    } else {
      // For new tasks, use raw fetch (useCreateTask could be used too)
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
    }
  }, [updateTask]);

  // Use React Query mutation for instant delete
  const handleDelete = useCallback(async (id: string) => {
    await deleteTask.mutateAsync(id);
  }, [deleteTask]);

  // Use React Query mutation for instant field updates
  const handleTaskUpdate = useCallback(async (taskId: string, field: string, value: string | null) => {
    await updateTask.mutateAsync({ id: taskId, [field]: value });
  }, [updateTask]);

  // Use React Query mutation for instant moves
  const handleTaskMove = useCallback(async (taskId: string, newDate: Date, newTime?: string) => {
    // Use moveTask for date changes, updateTask for time
    if (newTime !== undefined) {
      await updateTask.mutateAsync({ 
        id: taskId, 
        dueDate: format(newDate, "yyyy-MM-dd"),
        dueTime: newTime || null 
      });
    } else {
      await moveTask.mutateAsync({ taskId, newDate });
    }
  }, [moveTask, updateTask]);

  // Use React Query mutation for instant resize (duration change)
  const handleTaskResize = useCallback(async (taskId: string, newDuration: number) => {
    await updateTask.mutateAsync({ id: taskId, duration: newDuration } as { id: string; duration: number } & Partial<Task>);
  }, [updateTask]);

  return (
    <>
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Left Column - Task Lists */}
        <div className="space-y-6 overflow-y-auto min-h-0">
          <TaskTable
            tasks={filteredTodayTasks}
            projects={projects}
            organizations={organizations}
            title="Today"
            showFilters={true}
            hideDueColumn={true}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTodayTask}
            onTaskUpdate={handleTaskUpdate}
            editingTaskId={editingTaskId}
            onEditingComplete={handleEditingComplete}
          />

          <TaskTable
            tasks={filteredNextTasks}
            projects={projects}
            organizations={organizations}
            title="Next"
            showFilters={false}
            hideDueColumn={true}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewNextTask}
            onTaskUpdate={handleTaskUpdate}
            editingTaskId={editingTaskId}
            onEditingComplete={handleEditingComplete}
          />
        </div>

        {/* Right Column - Week View with Time (hidden on mobile) */}
        <div className="hidden lg:flex lg:flex-col lg:min-h-0 lg:flex-1">
          <TimeWeekCalendar 
            tasks={filteredWeekTasks} 
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
            onTaskResize={handleTaskResize}
          />
        </div>
      </div>

      <TaskDetailModal
        task={selectedTask}
        projects={projects}
        organizations={organizations}
        isOpen={isPanelOpen}
        isCreating={isCreating}
        defaultDate={defaultDate}
        onClose={handleClosePanel}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
