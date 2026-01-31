"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  MoreHorizontal,
  Maximize2,
  X,
  Tags,
  FileText,
  Sparkles,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PropertyRow } from "./PropertyRow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { TagInput } from "./TagInput";
import { PRDCreator } from "./PRDCreator";
import { toast } from "sonner";

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

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
  prd?: string | null;
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
  defaultDate?: Date | null;
  organizations: Organization[];
  projects: Project[];
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
  onExpand?: () => void;
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
  defaultDate,
  organizations: initialOrganizations,
  projects: initialProjects,
  onClose,
  onSave,
  onDelete,
  onExpand,
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Track if this is a newly created task (so we know when to auto-save)
  const [localTaskId, setLocalTaskId] = useState<string | null>(null);
  const hasCreatedRef = useRef(false);

  // Local lists (for inline creates)
  const [organizations, setOrganizations] = useState(initialOrganizations);
  const [projects, setProjects] = useState(initialProjects);

  // Tags
  const [taskTags, setTaskTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);

  // Combobox states
  const [orgOpen, setOrgOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  
  // Search states for inline create
  const [orgSearch, setOrgSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // PRD state
  const [showPrdCreator, setShowPrdCreator] = useState(false);
  const [prd, setPrd] = useState<string | null>(null);

  // Sync with props when they change
  useEffect(() => {
    setOrganizations(initialOrganizations);
  }, [initialOrganizations]);
  
  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  // Fetch all tags for the picker
  const fetchAllTags = useCallback(async () => {
    try {
      const res = await fetch("/api/tags");
      if (res.ok) {
        const data = await res.json();
        setAllTags(data.tags || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch task tags when task changes
  const fetchTaskTags = useCallback(async (taskId: string) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/tags`);
      if (res.ok) {
        const data = await res.json();
        setTaskTags(data.tags || []);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Fetch tags when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAllTags();
      if (task?.id) {
        fetchTaskTags(task.id);
      } else {
        setTaskTags([]);
      }
    }
  }, [isOpen, task?.id, fetchAllTags, fetchTaskTags]);

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
      setPrd(task.prd || null);
      setLocalTaskId(task.id);
      hasCreatedRef.current = true;
      setShowPrdCreator(false);
    } else {
      // Reset for new task
      setName("");
      setStatus("not_started");
      setPriority(null);
      setDueDate(defaultDate || undefined);
      setDueTime("");
      setOrganizationId(null);
      setProjectId(null);
      setDescription("");
      setPrd(null);
      setLocalTaskId(null);
      hasCreatedRef.current = false;
      setShowPrdCreator(false);
    }
  }, [task, isOpen, defaultDate]);

  // Auto-save function for existing tasks
  const autoSave = useCallback(async (updates: Partial<Task>) => {
    const taskId = localTaskId || task?.id;
    if (!taskId) return;

    setIsSaving(true);
    try {
      await onSave({ id: taskId, ...updates });
    } catch (error) {
      toast.error("Failed to save");
    } finally {
      setIsSaving(false);
    }
  }, [localTaskId, task?.id, onSave]);

  // Create new task when name is entered
  const createTask = useCallback(async (taskName: string) => {
    if (!taskName.trim() || hasCreatedRef.current) return;

    hasCreatedRef.current = true;
    setIsSaving(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName.trim(),
          status,
          priority,
          dueDate: dueDate ? `${format(dueDate, "yyyy-MM-dd")}T12:00:00.000Z` : null,
          dueTime: dueTime || null,
          organizationId,
          projectId,
          description: description || null,
        }),
      });

      if (!response.ok) throw new Error("Failed to create task");

      const { task: newTask } = await response.json();
      setLocalTaskId(newTask.id);
      router.refresh();
    } catch (error) {
      hasCreatedRef.current = false;
      toast.error("Failed to create task");
    } finally {
      setIsSaving(false);
    }
  }, [status, priority, dueDate, dueTime, organizationId, projectId, description, router]);

  // Handle name blur - create task if new, or save if existing
  const handleNameBlur = useCallback(() => {
    if (isCreating && !hasCreatedRef.current && name.trim()) {
      createTask(name);
    } else if (hasCreatedRef.current && name.trim()) {
      autoSave({ name: name.trim() });
    }
  }, [isCreating, name, createTask, autoSave]);

  // Handle field changes with auto-save
  const handleStatusChange = useCallback((newStatus: string) => {
    setStatus(newStatus);
    if (hasCreatedRef.current) {
      autoSave({ status: newStatus });
    }
  }, [autoSave]);

  const handlePriorityChange = useCallback((newPriority: string | null) => {
    setPriority(newPriority);
    if (hasCreatedRef.current) {
      autoSave({ priority: newPriority });
    }
  }, [autoSave]);

  const handleDateChange = useCallback((newDate: Date | undefined) => {
    setDueDate(newDate);
    if (hasCreatedRef.current) {
      autoSave({ 
        dueDate: newDate ? `${format(newDate, "yyyy-MM-dd")}T12:00:00.000Z` : null 
      });
    }
  }, [autoSave]);

  const handleTimeChange = useCallback((newTime: string) => {
    setDueTime(newTime);
    if (hasCreatedRef.current) {
      autoSave({ dueTime: newTime || null });
    }
  }, [autoSave]);

  const handleOrgChange = useCallback((newOrgId: string | null) => {
    setOrganizationId(newOrgId);
    // Clear project if it doesn't belong to new org
    if (newOrgId && projectId) {
      const project = projects.find((p) => p.id === projectId);
      if (project?.organizationId !== newOrgId) {
        setProjectId(null);
        if (hasCreatedRef.current) {
          autoSave({ organizationId: newOrgId, projectId: null });
          return;
        }
      }
    }
    if (hasCreatedRef.current) {
      autoSave({ organizationId: newOrgId });
    }
  }, [projectId, projects, autoSave]);

  const handleProjectChange = useCallback((newProjectId: string | null, projectOrgId?: string | null) => {
    setProjectId(newProjectId);
    // Auto-set organization if project has one
    if (newProjectId && projectOrgId && !organizationId) {
      setOrganizationId(projectOrgId);
      if (hasCreatedRef.current) {
        autoSave({ projectId: newProjectId, organizationId: projectOrgId });
        return;
      }
    }
    if (hasCreatedRef.current) {
      autoSave({ projectId: newProjectId });
    }
  }, [organizationId, autoSave]);

  // Tag handlers
  const handleAddTag = useCallback(async (tagId: string, name?: string) => {
    const taskId = localTaskId || task?.id;
    if (!taskId) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagId ? { tagId } : { name }),
      });

      if (res.ok) {
        const { tag } = await res.json();
        if (tag) {
          setTaskTags((prev) => [...prev, tag]);
          // Refresh all tags in case a new one was created
          fetchAllTags();
        }
      }
    } catch {
      toast.error("Failed to add tag");
    }
  }, [localTaskId, task?.id, fetchAllTags]);

  const handleRemoveTag = useCallback(async (tagId: string) => {
    const taskId = localTaskId || task?.id;
    if (!taskId) return;

    try {
      await fetch(`/api/tasks/${taskId}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });
      setTaskTags((prev) => prev.filter((t) => t.id !== tagId));
    } catch {
      toast.error("Failed to remove tag");
    }
  }, [localTaskId, task?.id]);

  // Debounced description save
  const descriptionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleDescriptionChange = useCallback((newDescription: string) => {
    setDescription(newDescription);
    
    if (descriptionTimeoutRef.current) {
      clearTimeout(descriptionTimeoutRef.current);
    }
    
    if (hasCreatedRef.current) {
      descriptionTimeoutRef.current = setTimeout(() => {
        autoSave({ description: newDescription || null });
      }, 500);
    }
  }, [autoSave]);

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
      
      setOrganizations((prev) => [...prev, newOrg]);
      handleOrgChange(newOrg.id);
      setOrgSearch("");
      setOrgOpen(false);
      toast.success(`Created "${newOrg.name}"`);
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
      
      setProjects((prev) => [...prev, newProject]);
      handleProjectChange(newProject.id, newProject.organizationId);
      setProjectSearch("");
      setProjectOpen(false);
      toast.success(`Created "${newProject.name}"`);
      router.refresh();
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleDelete = async () => {
    const taskId = localTaskId || task?.id;
    if (!taskId || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(taskId);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" showCloseButton={false}>
        {/* Custom header with More and Close buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-1">
          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--text-quaternary)] mr-2">
              <Loader2 size={12} className="animate-spin" />
              Saving...
            </div>
          )}
          {/* Three-dot menu for expand/delete */}
          {(task || localTaskId) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9"
                  tabIndex={-1}
                >
                  <MoreHorizontal size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-[var(--border-strong)]">
                {onExpand && (
                  <DropdownMenuItem onClick={onExpand}>
                    <Maximize2 size={14} className="mr-2" />
                    Expand
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="text-red-400 focus:text-red-400 focus:bg-red-400/10"
                  >
                    {isDeleting ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <Trash2 size={14} className="mr-2" />
                    )}
                    Delete task
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-9 w-9"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>

        <DialogHeader className="pb-4 pr-24">
          <DialogTitle className="sr-only">
            {isCreating ? "New Task" : "Edit Task"}
          </DialogTitle>
          {/* Editable Title */}
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.currentTarget.blur();
              }
            }}
            placeholder="Task name..."
            autoFocus
            className="text-4xl font-bold border-none bg-transparent px-0 h-auto focus-visible:ring-0 placeholder:text-[var(--text-quaternary)]"
          />
        </DialogHeader>

        <div className="space-y-1">
          {/* Status */}
          <PropertyRow icon={CircleDot} label="Status">
            <Select value={status} onValueChange={handleStatusChange}>
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
                    handleDateChange(date);
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
                        handleDateChange(undefined);
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
                            handleOrgChange(org.id);
                            setOrgSearch("");
                            setOrgOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {org.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
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
                              handleOrgChange(null);
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
                            handleProjectChange(project.id, project.organizationId);
                            setProjectSearch("");
                            setProjectOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          {project.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
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
                              handleProjectChange(null);
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
              onValueChange={(v) => handlePriorityChange(v === "none" ? null : v)}
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
              onChange={(e) => handleTimeChange(e.target.value)}
              className="h-8 w-auto border-none bg-transparent hover:bg-[var(--bg-surface)] px-2"
              placeholder="--:-- --"
            />
          </PropertyRow>

          {/* Tags */}
          {(task?.id || localTaskId) && (
            <PropertyRow icon={Tags} label="Tags" isEmpty={taskTags.length === 0}>
              <div className="-ml-2">
                <TagInput
                  taskId={localTaskId || task?.id || ""}
                  tags={taskTags}
                  allTags={allTags}
                  onAdd={handleAddTag}
                  onRemove={handleRemoveTag}
                  onRefreshTags={fetchAllTags}
                />
              </div>
            </PropertyRow>
          )}

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

        {/* PRD Section */}
        {(task?.id || localTaskId) && (
          <div className="mb-4">
            {showPrdCreator ? (
              <div>
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  {prd ? "Edit PRD" : "Create PRD"}
                </h3>
                <PRDCreator
                  taskId={localTaskId || task?.id || ""}
                  taskName={name}
                  existingPrd={prd}
                  onClose={() => setShowPrdCreator(false)}
                  onPrdSaved={(newPrd) => {
                    setPrd(newPrd);
                    router.refresh();
                  }}
                  onSubtasksCreated={() => {
                    router.refresh();
                  }}
                />
              </div>
            ) : prd ? (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] flex items-center gap-2">
                    <FileText size={14} />
                    PRD
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPrdCreator(true)}
                  >
                    Edit
                  </Button>
                </div>
                <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] p-3 max-h-[200px] overflow-y-auto">
                  <p className="text-sm text-[var(--text-tertiary)] line-clamp-4">
                    {prd.substring(0, 300)}...
                  </p>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full justify-center gap-2"
                onClick={() => setShowPrdCreator(true)}
              >
                <Sparkles size={14} />
                Generate PRD with AI
              </Button>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Description</h3>
          <div className="bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] min-h-[120px]">
            <RichEditor
              content={description}
              onChange={handleDescriptionChange}
              placeholder="Add task description..."
              minimal
            />
          </div>
        </div>

        {/* Create button for new tasks without a name yet */}
        {isCreating && !hasCreatedRef.current && (
          <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
            <Button
              onClick={() => name.trim() && createTask(name)}
              disabled={!name.trim() || isSaving}
              className="w-full"
            >
              {isSaving && <Loader2 size={14} className="animate-spin mr-2" />}
              Create Task
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
