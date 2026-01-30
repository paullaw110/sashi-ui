"use client";

import { useState, useEffect } from "react";
import { Trash2, Building2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  project?: SchemaProject | null;
  organization?: Organization | null;
};

interface TaskModalProps {
  task: Task | null;
  projects: SchemaProject[];
  organizations?: Organization[];
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

export function TaskModal({
  task,
  projects,
  organizations = [],
  isOpen,
  isCreating = false,
  defaultDate = null,
  onClose,
  onSave,
  onDelete,
}: TaskModalProps) {
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);
  const [status, setStatus] = useState("not_started");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Filter projects by selected organization
  const filteredProjects = organizationId 
    ? projects.filter(p => p.organizationId === organizationId)
    : projects;

  useEffect(() => {
    if (task) {
      setName(task.name);
      setOrganizationId(task.organizationId);
      setProjectId(task.projectId);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
      setDueTime(task.dueTime || "");
      setDescription(task.description || "");
      setIsEditing(false);
    } else if (isCreating) {
      setName("");
      setOrganizationId(null);
      setProjectId(null);
      setPriority(null);
      setStatus("not_started");
      setDueDate(defaultDate ? format(defaultDate, "yyyy-MM-dd") : "");
      setDueTime("");
      setDescription("");
      setIsEditing(true);
    }
  }, [task, isCreating, defaultDate]);

  // Clear project if organization changes and project doesn't belong to new org
  useEffect(() => {
    if (organizationId && projectId) {
      const selectedProject = projects.find(p => p.id === projectId);
      if (selectedProject && selectedProject.organizationId !== organizationId) {
        setProjectId(null);
      }
    }
  }, [organizationId, projectId, projects]);

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
        organizationId,
        projectId,
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
    try {
      await onDelete(task.id);
      onClose();
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert("Failed to delete task. Please try again.");
    }
  };

  const getStatusLabel = (s: string) => STATUSES.find(st => st.value === s)?.label || s;
  const getPriorityLabel = (p: string | null) => PRIORITIES.find(pr => pr.value === p)?.label || "None";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>
                {isCreating ? "New Task" : isEditing ? "Edit Task" : "Task Details"}
              </DialogTitle>
              {/* Context breadcrumb */}
              {(task?.organization || organizationId) && (
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Building2 size={12} />
                  <span>{task?.organization?.name || organizations.find(o => o.id === organizationId)?.name}</span>
                  {(task?.project || projectId) && (
                    <>
                      <span>/</span>
                      <Folder size={12} />
                      <span>{task?.project?.name || projects.find(p => p.id === projectId)?.name}</span>
                    </>
                  )}
                </div>
              )}
            </div>
            
            {task && !isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-4 py-4">
          {/* Task Name */}
          <div className="space-y-2">
            <Label>Task Name</Label>
            {isEditing ? (
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name..."
              />
            ) : (
              <p className="text-sm font-medium">{name}</p>
            )}
          </div>

          {/* Organization & Project */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              {isEditing ? (
                <Select
                  value={organizationId || "none"}
                  onValueChange={(value) => setOrganizationId(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {task?.organization?.name || "None"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              {isEditing ? (
                <Select
                  value={projectId || "none"}
                  onValueChange={(value) => setProjectId(value === "none" ? null : value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filteredProjects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {task?.project?.name || "None"}
                </p>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              {isEditing ? (
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
              ) : (
                <p className="text-xs text-muted-foreground">{getStatusLabel(status)}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              {isEditing ? (
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
              ) : (
                <p className="text-xs text-muted-foreground">{getPriorityLabel(priority)}</p>
              )}
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date</Label>
              {isEditing ? (
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {dueDate ? format(new Date(dueDate), "MMM dd, yyyy") : "None"}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Due Time</Label>
              {isEditing ? (
                <Input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {dueTime || "None"}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            {isEditing ? (
              <RichEditor
                content={description}
                onChange={setDescription}
                placeholder="Add task description..."
                className="min-h-[120px]"
              />
            ) : (
              <div className="text-xs text-muted-foreground prose prose-sm prose-invert max-w-none">
                {description ? (
                  <div dangerouslySetInnerHTML={{ __html: description }} />
                ) : (
                  <p>No description</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {isEditing && (
          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              {task && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
              )}
            </div>
            
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
                disabled={saving || !name.trim()}
              >
                {saving ? "Saving..." : isCreating ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
