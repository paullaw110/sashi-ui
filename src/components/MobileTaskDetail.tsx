"use client";

import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "./ui/drawer";
import { Calendar, Clock, Building2, Folder, Tag, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";

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
  [key: string]: unknown;
}

interface MobileTaskDetailProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<Task>) => void;
  onDelete?: () => void;
  organizations?: Array<{ id: string; name: string }>;
  projects?: Array<{ id: string; name: string; organizationId?: string | null }>;
}

const priorities = [
  { value: null, label: "None", color: "bg-gray-500" },
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" },
];

const statuses = [
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

export function MobileTaskDetail({
  task,
  open,
  onOpenChange,
  onSave,
  onDelete,
  organizations = [],
  projects = [],
}: MobileTaskDetailProps) {
  const [editedName, setEditedName] = useState("");
  const [editedNotes, setEditedNotes] = useState("");
  const [showPriorityPicker, setShowPriorityPicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (task) {
      setEditedName(task.name);
      setEditedNotes(task.notes || "");
    }
  }, [task]);

  const handleSaveName = () => {
    if (editedName.trim() && editedName !== task?.name) {
      onSave({ name: editedName.trim() });
    }
  };

  const handleSaveNotes = () => {
    if (editedNotes !== task?.notes) {
      onSave({ notes: editedNotes || null });
    }
  };

  const handlePriorityChange = (priority: string | null) => {
    onSave({ priority });
    setShowPriorityPicker(false);
  };

  const handleStatusChange = (status: string) => {
    onSave({ status });
    setShowStatusPicker(false);
    // Haptic on complete
    if (status === "done" && "vibrate" in navigator) {
      navigator.vibrate(10);
    }
  };

  if (!task) return null;

  const currentPriority = priorities.find((p) => p.value === task.priority) || priorities[0];
  const currentStatus = statuses.find((s) => s.value === task.status) || statuses[0];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="border-b border-[var(--border-subtle)]">
          <div className="flex items-start justify-between">
            <DrawerTitle className="sr-only">Edit Task</DrawerTitle>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleSaveName}
              className="flex-1 text-lg font-semibold bg-transparent border-none outline-none text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)]"
              placeholder="Task name"
            />
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 -mr-2 text-[var(--text-tertiary)]"
            >
              <X size={20} />
            </button>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Status
            </label>
            {showStatusPicker ? (
              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    className={cn(
                      "px-3 py-2 rounded-lg text-sm transition-colors",
                      task.status === status.value
                        ? "bg-[var(--accent)] text-[var(--bg-base)]"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    )}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setShowStatusPicker(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg text-left"
              >
                <span className="text-[var(--text-primary)]">{currentStatus.label}</span>
              </button>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Priority
            </label>
            {showPriorityPicker ? (
              <div className="flex flex-wrap gap-2">
                {priorities.map((priority) => (
                  <button
                    key={priority.value || "none"}
                    onClick={() => handlePriorityChange(priority.value)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                      task.priority === priority.value
                        ? "bg-[var(--accent)] text-[var(--bg-base)]"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    )}
                  >
                    <div className={cn("w-2.5 h-2.5 rounded-full", priority.color)} />
                    {priority.label}
                  </button>
                ))}
              </div>
            ) : (
              <button
                onClick={() => setShowPriorityPicker(true)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg text-left"
              >
                <div className="flex items-center gap-2">
                  <div className={cn("w-2.5 h-2.5 rounded-full", currentPriority.color)} />
                  <span className="text-[var(--text-primary)]">{currentPriority.label}</span>
                </div>
              </button>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Due Date
            </label>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg text-left"
            >
              <Calendar size={18} className="text-[var(--text-tertiary)]" />
              <span className={task.dueDate ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>
                {task.dueDate ? format(parseISO(task.dueDate), "MMM d, yyyy") : "No due date"}
              </span>
            </button>
            {showDatePicker && (
              <input
                type="date"
                value={task.dueDate ? task.dueDate.split("T")[0] : ""}
                onChange={(e) => {
                  onSave({ dueDate: e.target.value ? new Date(e.target.value).toISOString() : null });
                  setShowDatePicker(false);
                }}
                className="w-full px-3 py-2 bg-[var(--bg-subtle)] rounded-lg text-[var(--text-primary)] border border-[var(--border-default)]"
              />
            )}
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Duration (minutes)
            </label>
            <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg">
              <Clock size={18} className="text-[var(--text-tertiary)]" />
              <input
                type="number"
                value={task.duration || ""}
                onChange={(e) => onSave({ duration: e.target.value ? parseInt(e.target.value) : null })}
                placeholder="0"
                className="flex-1 bg-transparent border-none outline-none text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Organization */}
          {organizations.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Organization
              </label>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg">
                <Building2 size={18} className="text-[var(--text-tertiary)]" />
                <span className="text-[var(--text-primary)]">
                  {task.organization?.name || "None"}
                </span>
              </div>
            </div>
          )}

          {/* Project */}
          {projects.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Project
              </label>
              <div className="flex items-center gap-3 px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg">
                <Folder size={18} className="text-[var(--text-tertiary)]" />
                <span className="text-[var(--text-primary)]">
                  {task.project?.name || "None"}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {task.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs"
                    style={{
                      backgroundColor: tag.color ? `${tag.color}20` : "var(--bg-subtle)",
                      color: tag.color || "var(--text-secondary)",
                    }}
                  >
                    <Tag size={12} />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              Notes
            </label>
            <textarea
              value={editedNotes}
              onChange={(e) => setEditedNotes(e.target.value)}
              onBlur={handleSaveNotes}
              placeholder="Add notes..."
              rows={4}
              className="w-full px-3 py-2.5 bg-[var(--bg-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] border-none outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer with delete */}
        {onDelete && (
          <DrawerFooter className="border-t border-[var(--border-subtle)]">
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 w-full py-3 text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={18} />
              <span>Delete Task</span>
            </button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
