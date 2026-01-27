import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | number | null): string {
  if (!date) return "";
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function formatTime(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function getPriorityColor(priority: string | null): string {
  switch (priority?.toLowerCase()) {
    case "critical":
      return "bg-red-100 text-red-700 border-red-200";
    case "high":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "medium":
      return "bg-blue-100 text-blue-700 border-blue-200";
    case "low":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-50 text-gray-500 border-gray-100";
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-700";
    case "in_progress":
      return "bg-blue-100 text-blue-700";
    case "waiting":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case "not_started":
      return "Not Started";
    case "in_progress":
      return "In Progress";
    case "waiting":
      return "Waiting On Client";
    case "done":
      return "Done";
    default:
      return status;
  }
}

export function generateId(): string {
  return crypto.randomUUID();
}
