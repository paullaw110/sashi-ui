"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization, Project } from "@/lib/db/schema";

interface QuickAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrganizationId?: string;
  defaultProjectId?: string;
}

export function QuickAddTask({ 
  isOpen, 
  onClose, 
  defaultOrganizationId,
  defaultProjectId 
}: QuickAddTaskProps) {
  const [taskName, setTaskName] = useState("");
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(defaultOrganizationId || "");
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || "");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Fetch organizations and projects
  useEffect(() => {
    if (isOpen) {
      fetchOrganizations();
      fetchProjects();
    }
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTaskName("");
      setSelectedOrganizationId(defaultOrganizationId || "");
      setSelectedProjectId(defaultProjectId || "");
      setIsSubmitting(false);
    }
  }, [isOpen, defaultOrganizationId, defaultProjectId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/organizations");
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const fetchProjects = async () => {
    try {
      // Fetch projects through tasks API to get project data
      const response = await fetch("/api/tasks?view=all");
      const data = await response.json();
      
      // Extract unique projects
      const uniqueProjects = new Map<string, Project>();
      data.tasks?.forEach((task: any) => {
        if (task.project) {
          uniqueProjects.set(task.project.id, task.project);
        }
      });
      
      setProjects(Array.from(uniqueProjects.values()));
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName.trim(),
          organizationId: selectedOrganizationId || null,
          projectId: selectedProjectId || null,
          status: "not_started",
          priority: "medium",
        }),
      });

      if (response.ok) {
        router.refresh();
        onClose();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#0c0c0c] bg-[#e5e5e5] rounded p-0.5" />
              <h3 className="font-medium text-[#f5f5f5]">Quick Add Task</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#525252] hover:text-[#f5f5f5] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded-md text-[#f5f5f5] placeholder:text-[#525252] focus:outline-none focus:border-[#333] transition-colors"
                disabled={isSubmitting}
              />

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedOrganizationId}
                  onChange={(e) => setSelectedOrganizationId(e.target.value)}
                  className="px-3 py-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded-md text-[#f5f5f5] text-sm focus:outline-none focus:border-[#333] transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="">No Organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="px-3 py-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded-md text-[#f5f5f5] text-sm focus:outline-none focus:border-[#333] transition-colors"
                  disabled={isSubmitting}
                >
                  <option value="">No Project</option>
                  {projects
                    .filter(project => 
                      !selectedOrganizationId || 
                      project.organizationId === selectedOrganizationId ||
                      !project.organizationId
                    )
                    .map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                </select>
              </div>
              
              <div className="flex items-center justify-between text-xs text-[#525252]">
                <div>
                  Press <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] rounded font-mono">Enter</kbd> to create
                  • <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] rounded font-mono">Esc</kbd> to cancel
                </div>
                {isSubmitting && (
                  <span className="text-blue-400">Creating...</span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}