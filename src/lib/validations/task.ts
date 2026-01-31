import { z } from "zod";

export const taskFormSchema = z.object({
  name: z.string().min(1, "Task name is required").max(500, "Task name is too long"),
  organizationId: z.string().nullable(),
  projectId: z.string().nullable(),
  priority: z.enum(["non-negotiable", "critical", "high", "medium", "low"]).nullable(),
  status: z.enum(["not_started", "in_progress", "waiting", "done"]),
  dueDate: z.string().nullable(),
  dueTime: z.string().nullable(),
  description: z.string().nullable(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const PRIORITIES = [
  { value: "non-negotiable", label: "Non-Negotiable" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
] as const;

export const STATUSES = [
  { value: "not_started", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
] as const;
