"use client";

import { useState, useEffect } from "react";
import { X, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { RichEditor } from "./RichEditor";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null  // ISO string from server;
  dueTime: string | null;
  tags: string | null;
  description: string | null;
};

type Project = {
  id: string;
  name: string;
  color: string | null;
};

interface TaskModalProps {
  task: Task | null;
  projects: Project[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const PRIORITIES = [
  { value: "critical", label: "Urgent" },
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

export function TaskModal({ task, projects, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [status, setStatus] = useState("not_started");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
      setDueTime(task.dueTime || "");
      setDescription(task.description || "");
      setShowDescription(!!task.description);
    } else {
      setName("");
      setPriority(null);
      setStatus("not_started");
      setDueDate("");
      setDueTime("");
      setDescription("");
      setShowDescription(false);
    }
  }, [task]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: task?.id,
        name,
        priority,
        status,
        dueDate: dueDate || null,  // Keep as string, API handles conversion
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

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#111] border border-[#222] rounded-lg w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <span className="font-display text-lg text-[#f5f5f5]">
            {task ? "Edit task" : "New task"}
          </span>
          <button 
            onClick={onClose}
            className="p-1 text-[#404040] hover:text-[#737373] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task name"
            className="w-full px-0 py-2 bg-transparent border-b border-[#222] text-[#f5f5f5] text-sm placeholder:text-[#333] focus:outline-none focus:border-[#404040] transition-colors"
            autoFocus
          />

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-[#a3a3a3] text-xs focus:outline-none focus:border-[#333] transition-colors"
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
                className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-[#a3a3a3] text-xs focus:outline-none focus:border-[#333] transition-colors"
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
              <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Due date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-[#a3a3a3] text-xs focus:outline-none focus:border-[#333] transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-[#161616] border border-[#222] rounded text-[#a3a3a3] text-xs focus:outline-none focus:border-[#333] transition-colors"
              />
            </div>
          </div>

          {/* Description Toggle */}
          <button
            type="button"
            onClick={() => setShowDescription(!showDescription)}
            className="flex items-center gap-1.5 text-[10px] text-[#404040] hover:text-[#737373] transition-colors"
          >
            {showDescription ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showDescription ? "Hide description" : "Add description"}
          </button>

          {/* Description Editor */}
          {showDescription && (
            <div>
              <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Description</label>
              <RichEditor
                content={description}
                onChange={setDescription}
                placeholder="Add details, notes, or context..."
                className="max-h-48 overflow-y-auto"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-[#1a1a1a]">
          {task ? (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-[#737373] transition-colors"
            >
              <Trash2 size={12} />
              Delete
            </button>
          ) : (
            <div />
          )}
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="text-[11px] text-[#525252] hover:text-[#a3a3a3] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!name.trim() || saving}
              className="text-[11px] text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-1.5 rounded transition-colors"
            >
              {saving ? "Saving..." : task ? "Update" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
