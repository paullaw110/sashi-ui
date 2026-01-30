"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Organization, Project } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
      setTimeout(() => inputRef.current?.focus(), 100);
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
      const response = await fetch("/api/tasks?view=all");
      const data = await response.json();
      
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

  const filteredProjects = projects.filter(project => 
    !selectedOrganizationId || 
    project.organizationId === selectedOrganizationId ||
    !project.organizationId
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-primary rounded">
              <Plus size={14} className="text-primary-foreground" />
            </div>
            <DialogTitle>Quick Add Task</DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Input
            ref={inputRef}
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="What needs to be done?"
            disabled={isSubmitting}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              value={selectedOrganizationId || "none"}
              onValueChange={(value) => setSelectedOrganizationId(value === "none" ? "" : value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="No Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Organization</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedProjectId || "none"}
              onValueChange={(value) => setSelectedProjectId(value === "none" ? "" : value)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="No Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Project</SelectItem>
                {filteredProjects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              Press <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">Enter</kbd> to create
              • <kbd className="px-1.5 py-0.5 bg-secondary rounded font-mono text-[10px]">Esc</kbd> to cancel
            </div>
            <Button type="submit" size="sm" disabled={!taskName.trim() || isSubmitting}>
              {isSubmitting ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
