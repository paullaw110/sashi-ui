"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Folder,
  Plus,
  Settings,
  LayoutList,
  Pencil,
} from "lucide-react";
import { format } from "date-fns";
import { AppLayout } from "@/components/AppLayout";
import { TaskTable } from "@/components/TaskTable";
import { TaskDetailModal } from "@/components/TaskDetailModal";
import { OrganizationModal } from "@/components/OrganizationModal";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  createdAt: Date;
};

type Project = {
  id: string;
  name: string;
  icon: string | null;
  organizationId: string | null;
  taskCount: number;
  completedCount: number;
  createdAt: Date;
};

// Task type that matches what comes from server (serialized)
type ServerTask = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  description: string | null;
  tags: string | null;
  project: { id: string; name: string } | null;
  createdAt?: string;
};

// Type for TaskDetailModal
type ModalTask = {
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

type Stats = {
  projectCount: number;
  taskCount: number;
  completedCount: number;
};

interface OrganizationPageClientProps {
  organization: Organization;
  projects: Project[];
  tasks: ServerTask[];
  stats: Stats;
  allProjects: Array<{
    id: string;
    name: string;
    organizationId: string | null;
    organization: { id: string; name: string } | null;
  }>;
  allOrganizations: Array<{ id: string; name: string }>;
}

export function OrganizationPageClient({
  organization,
  projects,
  tasks: initialTasks,
  stats,
  allProjects,
  allOrganizations,
}: OrganizationPageClientProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [selectedTask, setSelectedTask] = useState<ModalTask | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isEditingOrg, setIsEditingOrg] = useState(false);

  // Handle task click
  const handleTaskClick = (task: ServerTask) => {
    setSelectedTask({
      id: task.id,
      name: task.name,
      projectId: task.projectId,
      organizationId: task.organizationId,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      description: task.description,
      createdAt: task.createdAt,
    });
    setIsCreatingTask(false);
    setIsTaskModalOpen(true);
  };

  // Handle new task
  const handleNewTask = () => {
    setSelectedTask(null);
    setIsCreatingTask(true);
    setIsTaskModalOpen(true);
  };

  // Handle task save
  const handleTaskSave = async (taskData: Partial<ModalTask> & { id?: string }) => {
    try {
      if (taskData.id) {
        // Update existing task
        const response = await fetch(`/api/tasks/${taskData.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(taskData),
        });
        if (!response.ok) throw new Error("Failed to update task");
        router.refresh();
      } else {
        // Create new task with org pre-filled
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...taskData,
            organizationId: organization.id,
          }),
        });
        if (!response.ok) throw new Error("Failed to create task");
        router.refresh();
      }
    } catch (error) {
      toast.error("Failed to save task");
      throw error;
    }
  };

  // Handle task delete
  const handleTaskDelete = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      setTasks(tasks.filter((t) => t.id !== taskId));
      setIsTaskModalOpen(false);
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
      throw error;
    }
  };

  // Handle org save
  const handleOrgSave = async (orgData: {
    id?: string;
    name: string;
    description?: string;
    icon?: string | null;
  }) => {
    try {
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orgData),
      });
      if (!response.ok) throw new Error("Failed to update organization");
      router.refresh();
      toast.success("Organization updated");
    } catch (error) {
      toast.error("Failed to update organization");
      throw error;
    }
  };

  // Handle inline task update
  const handleInlineTaskUpdate = async (
    taskId: string,
    field: string,
    value: string | null
  ) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!response.ok) throw new Error("Failed to update task");
      router.refresh();
    } catch (error) {
      toast.error("Failed to update task");
      throw error;
    }
  };

  // Handle new project
  const handleNewProject = async () => {
    const name = prompt("Project name:");
    if (!name?.trim()) return;

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          organizationId: organization.id,
        }),
      });
      if (!response.ok) throw new Error("Failed to create project");
      router.refresh();
      toast.success("Project created");
    } catch (error) {
      toast.error("Failed to create project");
    }
  };

  return (
    <AppLayout>
      <div className="p-6 max-w-6xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[var(--bg-surface)] flex items-center justify-center text-3xl">
              {organization.icon || (
                <Building2 size={28} className="text-[var(--text-quaternary)]" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-[var(--text-primary)]">
                {organization.name}
              </h1>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">
                Created {format(new Date(organization.createdAt), "MMM d, yyyy")} ·{" "}
                {stats.projectCount} project{stats.projectCount !== 1 ? "s" : ""} ·{" "}
                {stats.taskCount} task{stats.taskCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingOrg(true)}
          >
            <Pencil size={14} className="mr-2" />
            Edit
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects" className="gap-2">
              <Folder size={14} />
              Projects
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <LayoutList size={14} />
              Tasks
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings size={14} />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-[var(--text-primary)]">
                Projects
              </h2>
              <Button size="sm" onClick={handleNewProject}>
                <Plus size={14} className="mr-2" />
                New Project
              </Button>
            </div>

            {projects.length > 0 ? (
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                  <Card
                    key={project.id}
                    className="p-4 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
                    onClick={() =>
                      router.push(`/tasks?projectId=${project.id}`)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center text-xl">
                        {project.icon || (
                          <Folder
                            size={18}
                            className="text-[var(--text-quaternary)]"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-[var(--text-primary)] truncate">
                          {project.name}
                        </h3>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {project.completedCount}/{project.taskCount} tasks
                          {project.taskCount > 0 && (
                            <span className="ml-2">
                              (
                              {Math.round(
                                (project.completedCount / project.taskCount) *
                                  100
                              )}
                              %)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Folder
                  size={40}
                  className="mx-auto text-[var(--text-quaternary)] mb-3"
                />
                <p className="text-sm text-[var(--text-tertiary)]">
                  No projects yet
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleNewProject}
                  className="mt-2"
                >
                  <Plus size={14} className="mr-2" />
                  Create first project
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-[var(--text-primary)]">
                Tasks
              </h2>
              <Button size="sm" onClick={handleNewTask}>
                <Plus size={14} className="mr-2" />
                New Task
              </Button>
            </div>

            <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
              <TaskTable
                tasks={tasks.map((t) => ({
                  id: t.id,
                  name: t.name,
                  projectId: t.projectId,
                  organizationId: t.organizationId,
                  priority: t.priority,
                  status: t.status,
                  dueDate: t.dueDate ? new Date(t.dueDate).toISOString() : null,
                  dueTime: t.dueTime,
                  tags: t.tags,
                  project: t.project as any,
                  organization: {
                    id: organization.id,
                    name: organization.name,
                  } as any,
                }))}
                organizations={allOrganizations as any}
                projects={allProjects.map((p) => ({
                  id: p.id,
                  name: p.name,
                  organizationId: p.organizationId,
                })) as any}
                onTaskClick={(task) => handleTaskClick(task as ServerTask)}
                onTaskUpdate={handleInlineTaskUpdate}
                title=""
              />
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-[var(--text-primary)] mb-4">
                Organization Settings
              </h2>

              <Card className="p-6 space-y-6">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Name
                  </label>
                  <p className="text-[var(--text-primary)]">
                    {organization.name}
                  </p>
                </div>

                {organization.description && (
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                      Description
                    </label>
                    <p className="text-[var(--text-tertiary)]">
                      {organization.description}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-2">
                    Created
                  </label>
                  <p className="text-[var(--text-tertiary)]">
                    {format(
                      new Date(organization.createdAt),
                      "MMMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>

                <div className="pt-4 border-t border-[var(--border-default)]">
                  <Button onClick={() => setIsEditingOrg(true)}>
                    <Pencil size={14} className="mr-2" />
                    Edit Organization
                  </Button>
                </div>
              </Card>
            </div>

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm font-medium text-red-400 mb-4">
                Danger Zone
              </h3>
              <Card className="p-6 border-red-500/30">
                <p className="text-sm text-[var(--text-tertiary)] mb-4">
                  Deleting this organization will remove all associated projects
                  and unlink all tasks.
                </p>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    if (
                      !confirm(
                        `Delete "${organization.name}"? This cannot be undone.`
                      )
                    )
                      return;
                    try {
                      const response = await fetch(
                        `/api/organizations/${organization.id}`,
                        { method: "DELETE" }
                      );
                      if (!response.ok) throw new Error();
                      toast.success("Organization deleted");
                      router.push("/tasks");
                    } catch {
                      toast.error("Failed to delete organization");
                    }
                  }}
                >
                  Delete Organization
                </Button>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Task Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        isCreating={isCreatingTask}
        defaultDate={null}
        organizations={allOrganizations}
        projects={allProjects.map((p) => ({
          id: p.id,
          name: p.name,
          organizationId: p.organizationId,
        }))}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleTaskSave}
        onDelete={handleTaskDelete}
      />

      {/* Organization Edit Modal */}
      <OrganizationModal
        organization={organization}
        isOpen={isEditingOrg}
        onClose={() => setIsEditingOrg(false)}
        onSave={handleOrgSave}
      />
    </AppLayout>
  );
}
