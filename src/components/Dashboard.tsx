"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TaskTable } from "./TaskTable";
import { WeekCalendar } from "./WeekCalendar";
import { TaskSidePanel } from "./TaskSidePanel";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;  // ISO string from server
  dueTime: string | null;
  tags: string | null;
  description?: string | null;
};

type Project = {
  id: string;
  name: string;
  color: string | null;
};

interface DashboardProps {
  todayTasks: Task[];
  weekTasks: Task[];
  nextTasks: Task[];
  projects: Project[];
}

export function Dashboard({ todayTasks, weekTasks, nextTasks, projects }: DashboardProps) {
  const router = useRouter();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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

  const handleTaskMove = useCallback(async (taskId: string, newDate: Date) => {
    // Wait for API to complete before refreshing to avoid race condition
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: newDate.toISOString() }),
      });
      
      if (!response.ok) {
        console.error('Failed to move task:', await response.text());
      }
      
      // Small delay to ensure server revalidation completes
      await new Promise(resolve => setTimeout(resolve, 100));
      router.refresh();
    } catch (error) {
      console.error('Error moving task:', error);
      router.refresh(); // Refresh anyway to restore correct state
    }
  }, [router]);

  const handleTasksMove = useCallback(async (taskIds: string[], newDate: Date) => {
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

  return (
    <>
      <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Task Lists */}
        <div className="space-y-6">
          <TaskTable
            tasks={todayTasks}
            projects={projects}
            title="Today"
            showFilters={true}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTask}
            onStatusChange={handleStatusChange}
          />

          <TaskTable
            tasks={nextTasks}
            projects={projects}
            title="Next"
            showFilters={false}
            onTaskClick={handleTaskClick}
            onNewTask={handleNewTask}
            onStatusChange={handleStatusChange}
          />
        </div>

        {/* Right Column - Week View (hidden on mobile) */}
        <div className="hidden lg:block">
          <WeekCalendar 
            tasks={weekTasks} 
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
            onTasksMove={handleTasksMove}
          />
        </div>
      </div>

      <TaskSidePanel
        task={selectedTask}
        projects={projects}
        isOpen={isPanelOpen}
        isCreating={isCreating}
        onClose={handleClosePanel}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
