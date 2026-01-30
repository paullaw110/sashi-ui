"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

export type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  tags: string | null;
  description?: string | null;
  project?: { id: string; name: string } | null;
  organization?: { id: string; name: string } | null;
};

// Fetch all tasks
async function fetchTasks(): Promise<Task[]> {
  const response = await fetch("/api/tasks?view=all");
  if (!response.ok) throw new Error("Failed to fetch tasks");
  const data = await response.json();
  return data.tasks;
}

// Update a task
async function updateTask({
  id,
  ...updates
}: Partial<Task> & { id: string }): Promise<Task> {
  const response = await fetch(`/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  if (!response.ok) throw new Error("Failed to update task");
  const data = await response.json();
  return data.task;
}

// Hook to fetch tasks
// Accepts optional initialData from server to enable SSR + optimistic updates
export function useTasks(initialData?: Task[]) {
  return useQuery({
    queryKey: ["tasks"],
    queryFn: fetchTasks,
    initialData,
    // Don't refetch immediately if we have initial data - trust it
    staleTime: initialData ? 1000 * 30 : 0,
  });
}

// Hook to move a task to a new date
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, newDate }: { taskId: string; newDate: Date }) => {
      const dateStr = format(newDate, "yyyy-MM-dd");
      return updateTask({ id: taskId, dueDate: dateStr });
    },
    
    // Optimistic update - runs BEFORE the API call
    onMutate: async ({ taskId, newDate }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot previous state for rollback
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Format date the same way the API returns it (ISO string at noon)
      const dateStr = `${format(newDate, "yyyy-MM-dd")}T12:00:00.000Z`;

      // Optimistically update the cache - this is INSTANT
      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === taskId
            ? { ...task, dueDate: dateStr }
            : task
        );
      });

      return { previousTasks };
    },

    // Rollback on error
    onError: (err, variables, context) => {
      console.error("Move task error:", err);
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error("Failed to move task");
    },

    // Success - just show toast, don't refetch (optimistic update is already correct)
    onSuccess: (data, variables) => {
      toast.success(`Moved to ${format(variables.newDate, "MMM d")}`);
    },

    // Only refetch on error to ensure consistency, not on success
    // This prevents the "flash" when the server response replaces the optimistic data
  });
}

// Hook to move multiple tasks
export function useMoveTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskIds, newDate }: { taskIds: string[]; newDate: Date }) => {
      const dateStr = format(newDate, "yyyy-MM-dd");
      const results = await Promise.all(
        taskIds.map((id) => updateTask({ id, dueDate: dateStr }))
      );
      return results;
    },

    onMutate: async ({ taskIds, newDate }) => {
      queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      // Format date the same way the API returns it
      const dateStr = `${format(newDate, "yyyy-MM-dd")}T12:00:00.000Z`;

      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.map((task) =>
          taskIds.includes(task.id)
            ? { ...task, dueDate: dateStr }
            : task
        );
      });

      return { previousTasks };
    },

    onError: (err, variables, context) => {
      console.error("Move tasks error:", err);
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error(`Failed to move ${variables.taskIds.length} task(s)`);
    },

    onSuccess: (data, variables) => {
      toast.success(
        `Moved ${variables.taskIds.length} task${variables.taskIds.length > 1 ? "s" : ""} to ${format(variables.newDate, "MMM d")}`
      );
    },

    // No onSettled refetch - optimistic update is the source of truth
  });
}

// Hook to update task (generic)
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onMutate: async (newTask) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.map((task) =>
          task.id === newTask.id ? { ...task, ...newTask } : task
        );
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error("Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Hook to create task
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: Omit<Task, "id">) => {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      });
      if (!response.ok) throw new Error("Failed to create task");
      return response.json();
    },
    onSuccess: () => {
      toast.success("Task created");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Failed to create task");
    },
  });
}

// Hook to delete task
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      return response.json();
    },
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueryData<Task[]>(["tasks"], (old) => {
        if (!old) return old;
        return old.filter((task) => task.id !== taskId);
      });

      return { previousTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(["tasks"], context.previousTasks);
      }
      toast.error("Failed to delete task");
    },
    onSuccess: () => {
      toast.success("Task deleted");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}
