"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  Building2,
  FolderOpen,
  Flag,
  Loader2,
  Trash2,
  CircleDot,
  CalendarDays,
  Plus,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PropertyRow } from "./PropertyRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { RichEditor } from "./RichEditor";
import { toast } from "sonner";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  description?: string | null;
  createdAt?: string;
};

type Organization = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  organizationId: string | null;
};

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  isCreating?: boolean;
  organizations: Organization[];
  projects: Project[];
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const STATUSES = [
  { value: "not_started", label: "Not Started", color: "text-[var(--text-quaternary)]" },
  { value: "in_progress", label: "In Progress", color: "text-blue-400" },
  { value: "waiting", label: "Waiting", color: "text-amber-400" },
  { value: "done", label: "Done", color: "text-green-400" },
];

const PRIORITIES = [
  { value: "non-negotiable", label: "Non-Negotiable", color: "text-red-500" },
  { value: "critical", label: "Critical", color: "text-rose-400" },
  { value: "high", label: "High", color: "text-amber-400" },
  { value: "medium", label: "Medium", color: "text-yellow-400" },
  { value: "low", label: "Low", color: "text-emerald-400" },
];

export function TaskDetailModal({
  task,
  isOpen,
  isCreating = false,
  organizations: initialOrganizations,
  projects: initialProjects,
  onClose,
  onSave,
  onDelete,
}: TaskDetailModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [status, setStatus] = useState("not_started");
  const [priority, setPriority] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [dueTime, setDueTime] = useState<string>("");
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Local lists (for inline creates)
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [projects, setProjects] = useState(initialProjects);

  // Combobox states
  const [orgOpen, setOrgOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  
  // Search states for inline create
  const [orgSearch, setOrgSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Sync with props when they change
  useEffect(() => {
    setOrganizations(initialOrganizations);
  }, [initialOrganizations]);
  
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Initialize form when task changes
  useEffect(() => {
    if (task) {
      setName(task.name);
      setStatus(task.status);
      setPriority(task.priority);
      setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
      setDueTime(task.dueTime || "");
      setOrganizationId(task.organizationId);
      setProjectId(task.projectId);
      setDescription(task.description || "");
    } else {
      // Reset for new task
      setName("");
      setStatus("not_started");
      setPriority(null);
      setDueDate(undefined);
      setDueTime("");
      setOrganizationId(null);
      setProjectId(null);
      setDescription("");
    }
  }, [task, isOpen]);

  // Filter projects by selected organization
  const filteredProjects = organizationId
    ? projects.filter((p) => p.organizationId === organizationId)
    : projects;

  // Check if search term matches existing items
  const orgExists = organizations.some(
    (o) => o.name.toLowerCase() === orgSearch.toLowerCase()
  );
  const projectExists = filteredProjects.some(
    (p) => p.name.toLowerCase() === projectSearch.toLowerCase()
  );

  // Create new organization inline
  const handleCreateOrg = async () => {
    if (!orgSearch.trim() || isCreatingOrg) return;
    
    setIsCreatingOrg(true);
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: orgSearch.trim() }),
      });
      
      if (!response.ok) throw new Error("Failed to create organization");
      
      const { organization: newOrg } = await response.json();
      
      // Add to local list and select
      setOrganizations((prev) => [...prev, newOrg]);
      setOrganizationId(newOrg.id);
      setOrgSearch("");
      setOrgOpen(false);
      toast.success(`Created "${newOrg.name}"`);
      
      // Refresh to update server state
      router.refresh();
    } catch (error) {
      toast.error("Failed to create organization");
    } finally {
      setIsCreatingOrg(false);
    }
  };

  // Create new project inline
  const handleCreateProject = async () => {
    if (!projectSearch.trim() || isCreatingProject) return;
    
    setIsCreatingProject(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: projectSearch.trim(),
          organizationId: organizationId || null,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to create project");
      
      const { project: newProject } = await response.json();
      
      // Add to local list and select
      setProjects((prev) => [...prev, newProject]);
      setProjectId(newProject.id);
      setProjectSearch("");
      setProjectOpen(false);
      toast.success(`Created "${newProject.name}"`);
      
      // Refresh to update server state
      router.refresh();
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Task name is required");
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: task?.id,
        name: name.trim(),
        status,
        priority,
        dueDate: dueDate ? `${format(dueDate, "yyyy-MM-dd")}T12:00:00.000Z` : null,
        dueTime: dueTime || null,
        organizationId,
        projectId,
        description: description || null,
      });
      onClose();
    } catch (error) {
      toast.error("Failed to save task");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (error) {
      toast.error("Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedOrg = organizations.find((o) => o.id === organizationId);
  const selectedProject = projects.find((p) => p.id === projectId);
  const selectedStatus = STATUSES.find((s) => s.value === status);
  const selectedPriority = PRIORITIES.find((p) => p.value === priority);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="sr-only">
            {isCreating ? "New Task" : "Edit Task"}
          </DialogTitle>
          {/* Editable Title */}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Task name..."
            className="text-xl font-semibold border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-[var(--text-quaternary)]"
          />
        </DialogHeader>

        <div className="space-y-1">
          {/* Status */}
          <PropertyRow icon={CircleDot} label="Status">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-8 w-auto border-none bg-transparent hover:bg-[var(--bg-surface)] px-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "w-2 h-2 rounded-full",
                          s.value === "done" && "bg-green-400",
                          s.value === "in_progress" && "bg-blue-400",
                          s.value === "waiting" && "bg-amber-400",
                          s.value === "not_started" && "bg-[#525252]"
                        )}
                      />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyRow>

          {/* Due Date */}
          <PropertyRow icon={Calendar} label="Due" isEmpty={!dueDate}>
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <button className="text-sm hover:bg-[var(--bg-surface)] px-2 py-1 rounded -ml-2 transition-colors text-left">
                  {dueDate ? format(dueDate, "MMMM d, yyyy") : "Empty"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-[var(--bg-surface)] border-[var(--border-strong)]" align="start">
                <CalendarPicker
                  mode="single"
                  selected={dueDate}
                  onSelect={(date) => {
                    setDueDate(date);
                    setDateOpen(false);
                  }}
                  initialFocus
                />
                {dueDate && (
                  <div className="p-2 border-t border-[var(--border-strong)]">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      onClick={() => {
                        setDueDate(undefined);
                        setDateOpen(false);
                      }}
                    >
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </PropertyRow>

          {/* Organization */}
          <PropertyRow icon={Building2} label="Organization" isEmpty={!organizationId}>
            <Popover open={orgOpen} onOpenChange={(open) => {
              setOrgOpen(open);
              if (!open) setOrgSearch("");
            }}>
              <PopoverTrigger asChild>
                <button className="text-sm hover:bg-[var(--bg-surface)] px-2 py-1 rounded -ml-2 transition-colors text-left">
                  {selectedOrg?.name || "Empty"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 bg-[var(--bg-surface)] border-[var(--border-strong)]" align="start">
                <Command className="bg-transparent">
                  <CommandInput 
                    placeholder="Search or create..." 
                    className="border-none"
                    value={orgSearch}
                    onValueChange={setOrgSearch}
                  />
                  <CommandList>
                    <CommandGroup>
                      {organizations.map((org) => (
                        <CommandItem
                          key={org.id}
                          value={org.name}
                          onSelect={() => {
                            setOrganizationId(org.id);
                            // Clear project if it doesn't belong to new org
                            if (projectId) {
                              const project = projects.find((p) => p.id === projectId);
                              if (project?.organizationId !== org.id) {
                                setProjectId(null);
                              }
                            }
                            setOrgSearch("");
                            setOrgOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {org.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {/* Create new option */}
                    {orgSearch.trim() && !orgExists && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleCreateOrg}
                            className="cursor-pointer"
                            disabled={isCreatingOrg}
                          >
                            {isCreatingOrg ? (
                              <Loader2 size={14} className="mr-2 animate-spin" />
                            ) : (
                              <Plus size={14} className="mr-2" />
                            )}
                            Create
                            <span className="ml-1 px-1.5 py-0.5 bg-[#333] rounded text-xs">
                              {orgSearch}
                            </span>
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                    {organizationId && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setOrganizationId(null);
                              setProjectId(null);
                              setOrgSearch("");
                              setOrgOpen(false);
                            }}
                            className="text-red-400 cursor-pointer"
                          >
                            Clear selection
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </PropertyRow>

          {/* Project */}
          <PropertyRow icon={FolderOpen} label="Project" isEmpty={!projectId}>
            <Popover open={projectOpen} onOpenChange={(open) => {
              setProjectOpen(open);
              if (!open) setProjectSearch("");
            }}>
              <PopoverTrigger asChild>
                <button className="text-sm hover:bg-[var(--bg-surface)] px-2 py-1 rounded -ml-2 transition-colors text-left">
                  {selectedProject?.name || "Empty"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0 bg-[var(--bg-surface)] border-[var(--border-strong)]" align="start">
                <Command className="bg-transparent">
                  <CommandInput 
                    placeholder="Search or create..." 
                    className="border-none"
                    value={projectSearch}
                    onValueChange={setProjectSearch}
                  />
                  <CommandList>
                    <CommandGroup>
                      {filteredProjects.map((project) => (
                        <CommandItem
                          key={project.id}
                          value={project.name}
                          onSelect={() => {
                            setProjectId(project.id);
                            // Auto-set organization if project has one
                            if (project.organizationId && !organizationId) {
                              setOrganizationId(project.organizationId);
                            }
                            setProjectSearch("");
                            setProjectOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                    {/* Create new option */}
                    {projectSearch.trim() && !projectExists && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleCreateProject}
                            className="cursor-pointer"
                            disabled={isCreatingProject}
                          >
                            {isCreatingProject ? (
                              <Loader2 size={14} className="mr-2 animate-spin" />
                            ) : (
                              <Plus size={14} className="mr-2" />
                            )}
                            Create
                            <span className="ml-1 px-1.5 py-0.5 bg-[#333] rounded text-xs">
                              {projectSearch}
                            </span>
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                    {projectId && (
                      <>
                        <CommandSeparator />
                        <CommandGroup>
                          <CommandItem
                            onSelect={() => {
                              setProjectId(null);
                              setProjectSearch("");
                              setProjectOpen(false);
                            }}
                            className="text-red-400 cursor-pointer"
                          >
                            Clear selection
                          </CommandItem>
                        </CommandGroup>
                      </>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </PropertyRow>

          {/* Priority */}
          <PropertyRow icon={Flag} label="Priority" isEmpty={!priority}>
            <Select
              value={priority || "none"}
              onValueChange={(v) => setPriority(v === "none" ? null : v)}
            >
              <SelectTrigger className="h-8 w-auto border-none bg-transparent hover:bg-[var(--bg-surface)] px-2">
                <SelectValue placeholder="Empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-[var(--text-quaternary)]">None</span>
                </SelectItem>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    <span className={p.color}>{p.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyRow>

          {/* Due Time */}
          <PropertyRow icon={Clock} label="Time" isEmpty={!dueTime}>
            <Input
              type="time"
              value={dueTime}
              onChange={(e) => setDueTime(e.target.value)}
              className="h-8 w-auto border-none bg-transparent hover:bg-[var(--bg-surface)] px-2"
              placeholder="--:-- --"
            />
          </PropertyRow>

          {/* Created (read-only) */}
          {task?.createdAt && (
            <PropertyRow icon={CalendarDays} label="Created">
              <span className="text-sm text-[var(--text-tertiary)]">
                {format(new Date(task.createdAt), "MMMM d, yyyy h:mm a")}
              </span>
            </PropertyRow>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-[var(--border-default)] my-4" />

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Description</h3>
          <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] min-h-[120px]">
            <RichEditor
              content={description}
              onChange={setDescription}
              placeholder="Add task description..."
              minimal
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="mt-6 pt-4 border-t border-[var(--border-default)]">
          <div className="flex items-center justify-between w-full">
            {task && onDelete ? (
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                {isDeleting ? (
                  <Loader2 size={14} className="animate-spin mr-2" />
                ) : (
                  <Trash2 size={14} className="mr-2" />
                )}
                Delete
              </Button>
            ) : (
              <div />
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 size={14} className="animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
