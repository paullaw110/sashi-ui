"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Building2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null  // ISO string from server;
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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure tasks created from Today section get today's date if no date is set
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
        dueDate: finalDueDate,  // Keep as string, API handles conversion
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#0c0c0c] border border-[#1a1a1a] rounded-lg shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] sticky top-0 bg-[#0c0c0c] z-10">
          <div>
            <h2 className="font-display text-lg text-[#f5f5f5]">
              {isCreating ? "New Task" : isEditing ? "Edit Task" : "Task Details"}
            </h2>
            {/* Context breadcrumb */}
            {(task?.organization || organizationId) && (
              <div className="flex items-center gap-1 mt-1 text-xs text-[#737373]">
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
          
          <div className="flex items-center gap-2">
            {task && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-[#737373] hover:text-[#a3a3a3] px-3 py-1.5 rounded transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-[#737373] hover:text-[#a3a3a3] transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Task Name */}
          <div>
            <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Task Name</label>
            {isEditing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                placeholder="Enter task name..."
              />
            ) : (
              <p className="text-sm text-[#f5f5f5] font-medium">{name}</p>
            )}
          </div>

          {/* Organization & Project */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Organization</label>
              {isEditing ? (
                <select
                  value={organizationId || ""}
                  onChange={(e) => setOrganizationId(e.target.value || null)}
                  className="w-full text-xs text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                >
                  <option value="">Select organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[#a3a3a3]">
                  {task?.organization?.name || "None"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Project</label>
              {isEditing ? (
                <select
                  value={projectId || ""}
                  onChange={(e) => setProjectId(e.target.value || null)}
                  className="w-full text-xs text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                >
                  <option value="">Select project...</option>
                  {filteredProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[#a3a3a3]">
                  {task?.project?.name || "None"}
                </p>
              )}
            </div>
          </div>

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Status</label>
              {isEditing ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[#a3a3a3]">{getStatusLabel(status)}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Priority</label>
              {isEditing ? (
                <select
                  value={priority || ""}
                  onChange={(e) => setPriority(e.target.value || null)}
                  className="w-full text-xs text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                >
                  <option value="">None</option>
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-[#a3a3a3]">{getPriorityLabel(priority)}</p>
              )}
            </div>
          </div>

          {/* Due Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Due Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full text-xs text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-xs text-[#a3a3a3]">
                  {dueDate ? format(new Date(dueDate), "MMM dd, yyyy") : "None"}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Due Time</label>
              {isEditing ? (
                <input
                  type="time"
                  value={dueTime}
                  onChange={(e) => setDueTime(e.target.value)}
                  className="w-full text-xs text-[#f5f5f5] bg-[#111] border border-[#222] px-3 py-2 rounded focus:border-[#404040] focus:outline-none transition-colors"
                />
              ) : (
                <p className="text-xs text-[#a3a3a3]">
                  {dueTime || "None"}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs text-[#737373] mb-2 uppercase tracking-wider">Description</label>
            {isEditing ? (
              <RichEditor
                content={description}
                onChange={setDescription}
                placeholder="Add task description..."
                className="min-h-[120px]"
              />
            ) : (
              <div className="text-xs text-[#a3a3a3] prose prose-sm prose-invert max-w-none">
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
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#1a1a1a] bg-[#0a0a0a]">
            <div>
              {task && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isCreating) {
                    onClose();
                  } else {
                    setIsEditing(false);
                  }
                }}
                className="text-xs text-[#737373] hover:text-[#a3a3a3] px-4 py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex items-center gap-2 text-xs text-[#0c0c0c] bg-[#f5f5f5] hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded font-medium transition-colors"
              >
                {saving ? "Saving..." : isCreating ? "Create" : "Save"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}