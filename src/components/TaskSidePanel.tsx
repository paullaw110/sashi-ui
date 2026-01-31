"use client";

import { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Task = {
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
};

type Project = {
  id: string;
  name: string;
  color: string | null;
};

interface TaskSidePanelProps {
  task: Task | null;
  projects: Project[];
  isOpen: boolean;
  isCreating?: boolean;
  defaultDate?: Date | null;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITIES = [
  { value: "non-negotiable", label: "Non-Negotiable" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUSES = [
  { value: "not_started", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

export function TaskSidePanel({
  task,
  projects,
  isOpen,
  isCreating = false,
  defaultDate = null,
  onClose,
  onSave,
  onDelete,
}: TaskSidePanelProps) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [status, setStatus] = useState("not_started");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
      setDueTime(task.dueTime || "");
      setDescription(task.description || "");
      setIsEditing(false);
    } else if (isCreating) {
      setName("");
      setPriority(null);
      setStatus("not_started");
      setDueDate(defaultDate ? format(defaultDate, "yyyy-MM-dd") : "");
      setDueTime("");
      setDescription("");
      setIsEditing(true);
    }
  }, [task, isCreating, defaultDate]);

  const handleSave = async () => {
    setSaving(true);
    try {
      let finalDueDate = dueDate || null;
      if (isCreating && !finalDueDate && defaultDate) {
        finalDueDate = format(defaultDate, "yyyy-MM-dd");
      }
      
      await onSave({
        id: task?.id,
        name,
        priority,
        status,
        dueDate: finalDueDate,
        dueTime: dueTime || null,
        description: description || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!confirm("Delete this task?")) return;
    await onDelete(task.id);
    onClose();
  };

  const getStatusLabel = (s: string) => STATUSES.find(st => st.value === s)?.label || s;
  const getPriorityLabel = (p: string | null) => PRIORITIES.find(pr => pr.value === p)?.label || "None";

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isCreating ? "New Task" : isEditing ? "Edit Task" : "Task Details"}
          </SheetTitle>
        </SheetHeader>

        {/* Body */}
        <div className="py-6 space-y-6">
          {isEditing || isCreating ? (
            <>
              {/* Name */}
              <div className="space-y-2">
                <Label>Task Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What needs to be done?"
                  autoFocus
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={priority || "none"}
                    onValueChange={(value) => setPriority(value === "none" ? null : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <RichEditor
                  content={description}
                  placeholder="Add details, notes, or context..."
                  onChange={setDescription}
                />
              </div>
            </>
          ) : task && (
            <>
              {/* View Mode */}
              <div>
                <h2 className="text-xl font-semibold mb-4">{task.name}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Status</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      task.status === "done" && "bg-green-500/10 text-green-400",
                      task.status === "in_progress" && "bg-blue-500/10 text-blue-400",
                      task.status === "waiting" && "bg-amber-500/10 text-amber-400",
                      task.status === "not_started" && "bg-secondary text-muted-foreground"
                    )}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Priority</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      task.priority === "critical" && "bg-red-500/10 text-red-400",
                      task.priority === "high" && "bg-amber-500/10 text-amber-400",
                      task.priority === "medium" && "bg-blue-500/10 text-blue-400",
                      !task.priority && "text-muted-foreground"
                    )}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">Due Date</span>
                    <span className="text-sm text-muted-foreground">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                    </span>
                  </div>

                  {task.dueTime && (
                    <div className="flex items-center justify-between py-3 border-b">
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Time</span>
                      <span className="text-sm text-muted-foreground">{task.dueTime}</span>
                    </div>
                  )}
                </div>

                {/* Description Section */}
                <div className="mt-8 pt-6 border-t">
                  <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-3">Description</span>
                  {task.description ? (
                    <div 
                      className="text-sm prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No description</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t pt-4">
          {isEditing || isCreating ? (
            <div className="flex items-center justify-between">
              {task && !isCreating ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete
                </Button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (isCreating) {
                      onClose();
                    } else {
                      setIsEditing(false);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                >
                  {saving ? "Saving..." : isCreating ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 size={14} className="mr-1.5" />
                Delete
              </Button>
              <Button onClick={() => setIsEditing(true)}>
                Edit Task
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
