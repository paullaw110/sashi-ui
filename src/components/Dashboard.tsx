"use client";

import { useState, useCallback, useMemo } from "react";
import { TaskTable } from "./TaskTable";
import { TimeWeekCalendar } from "./TimeWeekCalendar";
import { TaskDetailModal } from "./TaskDetailModal";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";
import { useTasks, useUpdateTask, useDeleteTask, useMoveTask, Task } from "@/lib/hooks/use-tasks";
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

export function Dashboard({ todayTasks, weekTasks, nextTasks, projects, organizations = [] }: DashboardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

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
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();

  // Filter tasks for today (due today, not done)
  const filteredTodayTasks = useMemo((): TableTask[] => {
    if (!allTasks) return todayTasks as TableTask[];
    const now = new Date();
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);
    
    return (allTasks.filter(task => {
      if (task.status === "done") return false;
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= dayStart && due <= dayEnd;
    }) as TableTask[]);
  }, [allTasks, todayTasks]);

  // Filter tasks for next (tomorrow, not done)
  const filteredNextTasks = useMemo((): TableTask[] => {
    if (!allTasks) return nextTasks as TableTask[];
    const tomorrow = addDays(new Date(), 1);
    const dayStart = startOfDay(tomorrow);
    const dayEnd = endOfDay(tomorrow);
    
    return (allTasks.filter(task => {
      if (task.status === "done") return false;
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return due >= dayStart && due <= dayEnd;
    }) as TableTask[]);
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

  const handleNewTodayTask = useCallback(() => {
    handleNewTask(new Date());
  }, [handleNewTask]);

  const handleNewNextTask = useCallback(() => {
    handleNewTask(addDays(new Date(), 1));
  }, [handleNewTask]);

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

  // Use React Query mutation for instant status change
  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    await updateTask.mutateAsync({ id: taskId, status: newStatus });
  }, [updateTask]);

  // Inline create still uses fetch (optimistic handled by TaskTable)
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
    return data.task || null;
  }, []);

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

  return (
    <>
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Task Lists */}
        <div className="space-y-6">
          <TaskTable
            tasks={filteredTodayTasks}
            projects={projects}
            organizations={organizations}
            title="Today"
            showFilters={true}
            hideDueColumn={true}
            defaultDueDate={format(new Date(), "yyyy-MM-dd")}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTodayTask}
            onStatusChange={handleStatusChange}
            onTaskUpdate={handleTaskUpdate}
            onInlineCreate={handleInlineCreate}
          />

          <TaskTable
            tasks={filteredNextTasks}
            projects={projects}
            organizations={organizations}
            title="Next"
            showFilters={false}
            hideDueColumn={true}
            defaultDueDate={format(addDays(new Date(), 1), "yyyy-MM-dd")}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewNextTask}
            onStatusChange={handleStatusChange}
            onTaskUpdate={handleTaskUpdate}
            onInlineCreate={handleInlineCreate}
          />
        </div>

        {/* Right Column - Week View with Time (hidden on mobile) */}
        <div className="hidden lg:block h-[calc(100vh-180px)]">
          <TimeWeekCalendar 
            tasks={filteredWeekTasks} 
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
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
