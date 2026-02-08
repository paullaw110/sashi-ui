"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";

export type CalendarEvent = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string; // ISO date string
  startTime: string | null; // HH:mm format
  endTime: string | null; // HH:mm format
  isAllDay: boolean;
  color: string;
  recurrenceRule: string | null;
  recurrenceEnd: string | null;
  // Expanded occurrence fields
  instanceDate?: number; // timestamp of this specific occurrence
  isRecurringInstance?: boolean;
};

// Check if we're in Tauri
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

// Get API base URL - use Vercel API when in Tauri
function getApiBaseUrl(): string {
  if (isTauri()) {
    return "https://sashi-ui.vercel.app";
  }
  return "";
}

// Fetch events for a date range
async function fetchEvents(start: Date, end: Date): Promise<CalendarEvent[]> {
  const baseUrl = getApiBaseUrl();
  const startStr = format(start, "yyyy-MM-dd");
  const endStr = format(end, "yyyy-MM-dd");
  const response = await fetch(
    `${baseUrl}/api/events?start=${startStr}&end=${endStr}`
  );
  if (!response.ok) throw new Error("Failed to fetch events");
  const data = await response.json();
  return data.events;
}

// Update an event
async function updateEvent({
  id,
  editMode = "all",
  date,
  ...updates
}: Partial<CalendarEvent> & {
  id: string;
  editMode?: "all" | "thisAndFuture" | "single";
  date?: string;
}): Promise<CalendarEvent> {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams();
  if (editMode) params.set("editMode", editMode);
  if (date) params.set("date", date);

  const response = await fetch(
    `${baseUrl}/api/events/${id}?${params.toString()}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || "Failed to update event");
  }
  const data = await response.json();
  return data.event;
}

// Hook to fetch events for a date range
export function useEvents(start: Date, end: Date) {
  const startKey = format(start, "yyyy-MM-dd");
  const endKey = format(end, "yyyy-MM-dd");

  return useQuery({
    queryKey: ["events", startKey, endKey],
    queryFn: () => fetchEvents(start, end),
    staleTime: 1000 * 30, // 30 seconds
  });
}

// Hook to create an event
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (event: Omit<CalendarEvent, "id">) => {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(event),
      });
      if (!response.ok) throw new Error("Failed to create event");
      return response.json();
    },
    onSuccess: (data) => {
      toast.success("Event created");

      // Add new event to ALL event queries with expanded fields
      if (data?.event) {
        const expandedEvent = {
          ...data.event,
          instanceDate: new Date(data.event.startDate).getTime(),
          isRecurringInstance: false,
        };
        queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, (old) => {
          if (!old) return [expandedEvent];
          return [...old, expandedEvent];
        });
      }
      // Also invalidate to ensure fresh data from server
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
    onError: () => {
      toast.error("Failed to create event");
    },
  });
}

// Hook to update an event
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateEvent,
    onMutate: async (newEvent) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["events"] });

      // Get previous data for rollback
      const allEventQueries = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: ["events"] });
      const previousEvents = allEventQueries.length > 0 ? allEventQueries[0][1] : undefined;

      // Optimistically update ALL event queries
      queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, (old) => {
        if (!old) return old;
        return old.map((event) => {
          if (event.id !== newEvent.id) return event;
          return { ...event, ...newEvent };
        });
      });

      return { previousEvents };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousEvents) {
        queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, () => context.previousEvents);
      }
      toast.error("Failed to update event");
    },
    onSuccess: (data) => {
      // Update with server response (don't invalidate!)
      // data is CalendarEvent returned from updateEvent function
      if (data?.id) {
        queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, (old) => {
          if (!old) return old;
          return old.map((e) => (e.id === data.id ? data : e));
        });
      }
    },
  });
}

// Hook to move an event to a new date/time
export function useMoveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      newDate,
      newTime,
      editMode = "all",
      instanceDate,
    }: {
      eventId: string;
      newDate: Date;
      newTime?: string;
      editMode?: "all" | "thisAndFuture" | "single";
      instanceDate?: string;
    }) => {
      const dateStr = format(newDate, "yyyy-MM-dd");

      // Calculate new endTime to preserve duration
      let newEndTime: string | undefined = undefined;
      if (newTime) {
        // Find the original event to get duration
        const allEventQueries = queryClient.getQueriesData<CalendarEvent[]>({
          queryKey: ["events"]
        });
        const events = allEventQueries.length > 0 ? allEventQueries[0][1] : [];
        const originalEvent = events?.find(e => e.id === eventId);

        if (originalEvent?.startTime && originalEvent?.endTime) {
          // Calculate original duration in minutes
          const [startHour, startMin] = originalEvent.startTime.split(':').map(Number);
          const [endHour, endMin] = originalEvent.endTime.split(':').map(Number);
          const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

          // Calculate new end time
          const [newStartHour, newStartMin] = newTime.split(':').map(Number);
          const newEndMinutes = newStartHour * 60 + newStartMin + durationMinutes;
          const newEndHour = Math.floor(newEndMinutes / 60);
          const newEndMin = newEndMinutes % 60;
          newEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;
        }
      }

      return updateEvent({
        id: eventId,
        startDate: dateStr,
        startTime: newTime,
        endTime: newEndTime,
        editMode,
        date: instanceDate,
      });
    },
    onMutate: async ({ eventId, newDate, newTime }) => {
      // Cancel ALL event queries
      await queryClient.cancelQueries({ queryKey: ["events"] });

      // Get data from ANY events query using getQueriesData
      const allEventQueries = queryClient.getQueriesData<CalendarEvent[]>({ queryKey: ["events"] });
      const previousEvents = allEventQueries.length > 0 ? allEventQueries[0][1] : undefined;

      // Format date consistently with API expectations
      const dateStr = `${format(newDate, "yyyy-MM-dd")}T12:00:00.000Z`;

      // Update ALL event queries using setQueriesData
      queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, (old) => {
        if (!old) return old;
        return old.map((event) => {
          if (event.id !== eventId) return event;

          // Calculate new endTime to preserve duration
          let preservedEndTime = event.endTime;
          if (newTime && event.startTime && event.endTime) {
            const [startHour, startMin] = event.startTime.split(':').map(Number);
            const [endHour, endMin] = event.endTime.split(':').map(Number);
            const durationMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);

            const [newStartHour, newStartMin] = newTime.split(':').map(Number);
            const newEndMinutes = newStartHour * 60 + newStartMin + durationMinutes;
            const newEndHour = Math.floor(newEndMinutes / 60);
            const newEndMin = newEndMinutes % 60;
            preservedEndTime = `${newEndHour.toString().padStart(2, '0')}:${newEndMin.toString().padStart(2, '0')}`;
          }

          return {
            ...event,
            startDate: dateStr,
            startTime: newTime || event.startTime,
            endTime: preservedEndTime,
          };
        });
      });

      return { previousEvents };  // For error rollback
    },
    onError: (err, variables, context) => {
      console.error("Move event error:", err);

      // Rollback ALL event queries
      if (context?.previousEvents) {
        queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, () => context.previousEvents);
      }

      toast.error("Failed to move event");
    },
    onSuccess: (data, variables) => {
      toast.success(`Moved to ${format(variables.newDate, "MMM d")}`);

      // Update ALL event queries with server response
      // data is CalendarEvent returned from updateEvent function
      if (data?.id) {
        queryClient.setQueriesData<CalendarEvent[]>({ queryKey: ["events"] }, (old) => {
          if (!old) return old;
          return old.map((e) => (e.id === data.id ? data : e));
        });
      }

      // DO NOT call invalidateQueries - trust optimistic update
    },
  });
}

// Hook to delete an event
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      deleteMode = "all",
      date,
    }: {
      eventId: string;
      deleteMode?: "all" | "thisAndFuture" | "single";
      date?: string;
    }) => {
      const baseUrl = getApiBaseUrl();
      const params = new URLSearchParams();
      if (deleteMode) params.set("deleteMode", deleteMode);
      if (date) params.set("date", date);

      const response = await fetch(
        `${baseUrl}/api/events/${eventId}?${params.toString()}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Failed to delete event");
      return response.json();
    },
    onMutate: async ({ eventId }) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      return {};
    },
    onError: () => {
      toast.error("Failed to delete event");
    },
    onSuccess: () => {
      toast.success("Event deleted");
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
