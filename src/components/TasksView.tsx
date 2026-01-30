"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { List, Calendar, Plus, Circle, CheckCircle2, Clock, AlertCircle, Search, X, Building2, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskModal } from "./TaskModal";
import { OrganizationModal } from "./OrganizationModal";
import { MonthCalendar } from "./MonthCalendar";
import OrganizationManager from "./OrganizationManager";
import MigrationWizard from "./MigrationWizard";
import Breadcrumb from "./Breadcrumb";
import { format } from "date-fns";
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

interface TasksViewProps {
  tasks: Task[];
  projects: SchemaProject[];
  organizations?: Organization[];
}

function getStatusIcon(status: string) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={14} className="text-green-500" />;
    case "in_progress":
      return <Clock size={14} className="text-blue-400" />;
    case "waiting":
      return <AlertCircle size={14} className="text-amber-400" />;
    default:
      return <Circle size={14} className="text-[#404040]" />;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "done":
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/20">
          Done
        </span>
      );
    case "in_progress":
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/20">
          In Progress
        </span>
      );
    case "waiting":
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
          Waiting
        </span>
      );
    default:
      return (
        <span className="text-[10px] px-2 py-0.5 rounded bg-[#1a1a1a] text-[#525252] border border-[#222]">
          Todo
        </span>
      );
  }
}

function getPriorityBadge(priority: string | null) {
  if (!priority) return <span className="text-[10px] text-[#333]">—</span>;
  
  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    "non-negotiable": { 
      label: "Non-Negotiable", 
      bg: "bg-red-500/15", 
      text: "text-red-400", 
      border: "border-red-500/30" 
    },
    critical: { 
      label: "Critical", 
      bg: "bg-rose-500/15", 
      text: "text-rose-400", 
      border: "border-rose-500/30" 
    },
    high: { 
      label: "High", 
      bg: "bg-amber-500/15", 
      text: "text-amber-400", 
      border: "border-amber-500/30" 
    },
    medium: { 
      label: "Medium", 
      bg: "bg-yellow-500/15", 
      text: "text-yellow-400", 
      border: "border-yellow-500/30" 
    },
    low: { 
      label: "Low", 
      bg: "bg-emerald-500/15", 
      text: "text-emerald-400", 
      border: "border-emerald-500/30" 
    },
  };
  
  const { label, bg, text, border } = config[priority] || { 
    label: priority, 
    bg: "bg-[#1a1a1a]", 
    text: "text-[#525252]", 
    border: "border-[#222]" 
  };
  
  return (
    <span className={cn(
      "text-[10px] px-2 py-0.5 rounded border whitespace-nowrap",
      bg, text, border
    )}>
      {label}
    </span>
  );
}

export function TasksView({ tasks, projects, organizations = [] }: TasksViewProps) {
  const router = useRouter();
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showOrganizations, setShowOrganizations] = useState(false);
  const [showMigrationWizard, setShowMigrationWizard] = useState(false);

  // Organization modal state
  const [selectedOrgForEdit, setSelectedOrgForEdit] = useState<Organization | null>(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isCreatingOrg, setIsCreatingOrg] = useState(false);
  const [orgRefreshTrigger, setOrgRefreshTrigger] = useState(0);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Status filter
      if (filterStatus && task.status !== filterStatus) return false;
      
      // Priority filter
      if (filterPriority && task.priority !== filterPriority) return false;
      
      // Organization filter
      if (selectedOrganization) {
        if (task.organizationId !== selectedOrganization.id) return false;
      }
      
      // Search filter - search in both name and description
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = task.name.toLowerCase().includes(query);
        const matchesDescription = task.description?.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesDescription) return false;
      }
      
      return true;
    });
  }, [tasks, filterStatus, filterPriority, selectedOrganization, searchQuery]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsPanelOpen(true);
  }, []);

  const handleNewTask = useCallback(() => {
    setSelectedTask(null);
    setIsCreating(true);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedTask(null);
    setIsCreating(false);
  }, []);

  const handleSave = useCallback(async (taskData: Partial<Task>) => {
    if (taskData.id) {
      await fetch(`/api/tasks/${taskData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
    } else {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      });
    }
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      
      router.refresh();
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error; // Re-throw so the modal can handle it
    }
  }, [router]);

  const handleStatusChange = useCallback(async (taskId: string, newStatus: string) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }, [router]);

  const cycleStatus = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const statuses = ["not_started", "in_progress", "waiting", "done"];
    const currentIndex = statuses.indexOf(task.status);
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    handleStatusChange(task.id, nextStatus);
  };

  const handleTaskMove = useCallback(async (taskId: string, newDate: Date) => {
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate: newDate.toISOString() }),
    });
    router.refresh();
  }, [router]);

  const handleTasksMove = useCallback(async (taskIds: string[], newDate: Date) => {
    // Move all selected tasks in parallel
    await Promise.all(
      taskIds.map(taskId =>
        fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: newDate.toISOString() }),
        })
      )
    );
    router.refresh();
  }, [router]);

  // Organization handlers
  const handleCreateOrganization = useCallback(() => {
    setSelectedOrgForEdit(null);
    setIsCreatingOrg(true);
    setIsOrgModalOpen(true);
  }, []);

  const handleEditOrganization = useCallback((organization: Organization) => {
    setSelectedOrgForEdit(organization);
    setIsCreatingOrg(false);
    setIsOrgModalOpen(true);
  }, []);

  const handleCloseOrgModal = useCallback(() => {
    setIsOrgModalOpen(false);
    setSelectedOrgForEdit(null);
    setIsCreatingOrg(false);
  }, []);

  const handleSaveOrganization = useCallback(async (orgData: { id?: string; name: string; description?: string }) => {
    try {
      if (orgData.id) {
        // Update existing organization
        const response = await fetch(`/api/organizations/${orgData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgData.name, description: orgData.description }),
        });
        if (!response.ok) throw new Error(`Update failed: ${response.status}`);
      } else {
        // Create new organization
        const response = await fetch("/api/organizations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: orgData.name, description: orgData.description }),
        });
        if (!response.ok) throw new Error(`Create failed: ${response.status}`);
      }
      
      // Trigger refresh
      setOrgRefreshTrigger(prev => prev + 1);
      router.refresh();
    } catch (error) {
      console.error("Failed to save organization:", error);
      throw error; // Re-throw so modal can handle it
    }
  }, [router]);

  const handleDeleteOrganization = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }
      
      // If the deleted org was selected, clear the selection
      if (selectedOrganization?.id === id) {
        setSelectedOrganization(null);
      }
      
      // Trigger refresh
      setOrgRefreshTrigger(prev => prev + 1);
      router.refresh();
    } catch (error) {
      console.error("Failed to delete organization:", error);
      throw error; // Re-throw so modal can handle it
    }
  }, [selectedOrganization, router]);

  const clearAllFilters = useCallback(() => {
    setSearchQuery("");
    setFilterStatus(null);
    setFilterPriority(null);
    setSelectedOrganization(null);
  }, []);

  const hasActiveFilters = searchQuery || filterStatus || filterPriority || selectedOrganization;

  return (
    <div className={cn("flex flex-col", view === "calendar" && "h-[calc(100vh-180px)]")}>
      {/* Organization Panel */}
      {showOrganizations && (
        <div className="mb-4 p-4 bg-[#111] border border-[#1a1a1a] rounded-lg">
          <OrganizationManager
            onOrganizationSelect={setSelectedOrganization}
            selectedOrganizationId={selectedOrganization?.id || null}
            onCreateClick={handleCreateOrganization}
            onEditClick={handleEditOrganization}
            onRefresh={orgRefreshTrigger}
          />
        </div>
      )}

      {/* Header with view toggle and filters */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <div className="flex items-center bg-[#111] rounded-lg p-0.5 border border-[#1a1a1a]">
            <button
              onClick={() => setView("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                view === "calendar"
                  ? "bg-[#1c1c1c] text-[#f5f5f5]"
                  : "text-[#525252] hover:text-[#737373]"
              )}
            >
              <Calendar size={14} />
              Calendar
            </button>
            <button
              onClick={() => setView("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors",
                view === "list"
                  ? "bg-[#1c1c1c] text-[#f5f5f5]"
                  : "text-[#525252] hover:text-[#737373]"
              )}
            >
              <List size={14} />
              List
            </button>
          </div>

          {/* Organization Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrganizations(!showOrganizations)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors border",
                showOrganizations
                  ? "bg-[#1c1c1c] text-[#f5f5f5] border-[#333]"
                  : "text-[#525252] hover:text-[#737373] border-[#222] hover:border-[#333]"
              )}
            >
              <Building2 size={14} />
              Organizations
            </button>

            {selectedOrganization && (
              <div className="px-2 py-1 text-xs bg-[#1a1a1a] text-[#e5e5e5] rounded border border-[#222]">
                {selectedOrganization.name}
              </div>
            )}

            <button
              onClick={() => setShowMigrationWizard(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors border border-[#222] hover:border-[#333] text-[#525252] hover:text-[#737373]"
            >
              <ArrowUpDown size={14} />
              Migrate Projects
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#404040]" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs text-[#e5e5e5] bg-[#111] border border-[#222] pl-9 pr-3 py-1.5 rounded hover:border-[#333] focus:border-[#404040] focus:outline-none transition-colors w-48"
            />
          </div>

          {/* Filters */}
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="text-xs text-[#525252] bg-[#111] border border-[#222] px-2 py-1.5 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="">All Status</option>
            <option value="not_started">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting">Waiting</option>
            <option value="done">Done</option>
          </select>
          <select
            value={filterPriority || ""}
            onChange={(e) => setFilterPriority(e.target.value || null)}
            className="text-xs text-[#525252] bg-[#111] border border-[#222] px-2 py-1.5 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="">All Priority</option>
            <option value="non-negotiable">Non-Negotiable</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1.5 text-xs text-[#525252] hover:text-[#737373] border border-[#222] hover:border-[#333] px-2 py-1.5 rounded transition-colors"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>

        <button 
          onClick={handleNewTask}
          className="flex items-center gap-1.5 text-xs text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] px-3 py-1.5 rounded-lg font-medium transition-colors"
        >
          <Plus size={14} />
          New Task
        </button>
      </div>

      {/* Content */}
      {view === "list" ? (
        <div className="bg-[#111] rounded-lg border border-[#1a1a1a]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-[#1a1a1a] text-[10px] text-[#525252] uppercase tracking-widest">
            <div className="col-span-5">Task</div>
            <div className="col-span-2">Context</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-1">Due</div>
          </div>

          {/* Task Rows */}
          <div className="divide-y divide-[#161616]">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleTaskClick(task)}
                className={cn(
                  "grid grid-cols-12 gap-4 px-4 py-3 hover:bg-[#161616] cursor-pointer transition-colors items-center",
                  task.status === "done" && "opacity-40"
                )}
              >
                <div className="col-span-5 flex items-center gap-3">
                  <button
                    onClick={(e) => cycleStatus(e, task)}
                    className="hover:opacity-70 transition-opacity shrink-0"
                  >
                    {getStatusIcon(task.status)}
                  </button>
                  <span className={cn(
                    "text-sm truncate font-medium",
                    task.status === "done" ? "text-[#525252] line-through" : "text-[#e5e5e5]"
                  )}>
                    {task.name}
                  </span>
                </div>
                <div className="col-span-2">
                  <Breadcrumb
                    organization={task.organization}
                    project={task.project}
                    className="truncate"
                  />
                </div>
                <div className="col-span-2">
                  {getPriorityBadge(task.priority)}
                </div>
                <div className="col-span-2">
                  {getStatusBadge(task.status)}
                </div>
                <div className="col-span-1">
                  <span className="text-xs text-[#525252]">
                    {task.dueDate ? format(new Date(task.dueDate), "MMM d") : "—"}
                  </span>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="px-4 py-12 text-center text-[#404040] text-xs">
                No tasks found
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-[#1a1a1a]">
            <span className="text-xs text-[#525252]">
              {filteredTasks.length} task{filteredTasks.length !== 1 && "s"}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <MonthCalendar 
            tasks={filteredTasks} 
            onTaskClick={handleTaskClick}
            onTaskMove={handleTaskMove}
            onTasksMove={handleTasksMove}
          />
        </div>
      )}

      <TaskModal
        task={selectedTask}
        projects={projects}
        organizations={organizations}
        isOpen={isPanelOpen}
        isCreating={isCreating}
        onClose={handleClosePanel}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      {/* Migration Wizard */}
      {showMigrationWizard && (
        <MigrationWizard
          onComplete={() => {
            setShowMigrationWizard(false);
            router.refresh();
          }}
          onCancel={() => setShowMigrationWizard(false)}
        />
      )}

      {/* Organization Modal */}
      <OrganizationModal
        organization={selectedOrgForEdit}
        isOpen={isOrgModalOpen}
        isCreating={isCreatingOrg}
        onClose={handleCloseOrgModal}
        onSave={handleSaveOrganization}
        onDelete={handleDeleteOrganization}
      />
    </div>
  );
}
