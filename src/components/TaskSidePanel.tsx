"use client";

import { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";

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

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-full sm:w-[420px] bg-[#0c0c0c] border-l border-[#1a1a1a] z-50 transform transition-transform duration-300 ease-out overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-[#1a1a1a] sticky top-0 bg-[#0c0c0c] z-10">
          <span className="font-display text-lg text-[#f5f5f5]">
            {isCreating ? "New Task" : isEditing ? "Edit Task" : "Task Details"}
          </span>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#404040] hover:text-[#737373] hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {isEditing || isCreating ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Task Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#f5f5f5] text-sm placeholder:text-[#333] focus:outline-none focus:border-[#404040] transition-colors"
                  autoFocus
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Priority</label>
                  <select
                    value={priority || ""}
                    onChange={(e) => setPriority(e.target.value || null)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  >
                    <option value="">None</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Description</label>
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
                <h2 className="font-display text-xl text-[#f5f5f5] mb-4">{task.name}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider">Status</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      task.status === "done" && "bg-green-500/10 text-green-400",
                      task.status === "in_progress" && "bg-blue-500/10 text-blue-400",
                      task.status === "waiting" && "bg-amber-500/10 text-amber-400",
                      task.status === "not_started" && "bg-[#1a1a1a] text-[#737373]"
                    )}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider">Priority</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      task.priority === "critical" && "bg-red-500/10 text-red-400",
                      task.priority === "high" && "bg-amber-500/10 text-amber-400",
                      task.priority === "medium" && "bg-blue-500/10 text-blue-400",
                      !task.priority && "text-[#525252]"
                    )}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider">Due Date</span>
                    <span className="text-sm text-[#a3a3a3]">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                    </span>
                  </div>

                  {task.dueTime && (
                    <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                      <span className="text-[11px] text-[#525252] uppercase tracking-wider">Time</span>
                      <span className="text-sm text-[#a3a3a3]">{task.dueTime}</span>
                    </div>
                  )}
                </div>

                {/* Description Section */}
                <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
                  <span className="text-[11px] text-[#525252] uppercase tracking-wider block mb-3">Description</span>
                  {task.description ? (
                    <div 
                      className="text-sm prose prose-invert prose-sm max-w-none [&_p]:text-[#a3a3a3] [&_li]:text-[#a3a3a3] [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  ) : (
                    <p className="text-sm text-[#333] italic">No description</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0c0c0c] border-t border-[#1a1a1a] px-6 py-4">
          {isEditing || isCreating ? (
            <div className="flex items-center justify-between">
              {task && !isCreating ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isCreating) {
                      onClose();
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  className="text-[11px] text-[#525252] hover:text-[#a3a3a3] px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="text-[11px] text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors font-medium"
                >
                  {saving ? "Saving..." : isCreating ? "Create" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] px-5 py-2 rounded-lg transition-colors font-medium"
              >
                Edit Task
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
