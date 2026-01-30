"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2, Building2, Folder } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { RichEditor } from "./RichEditor";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { taskFormSchema, TaskFormValues, PRIORITIES, STATUSES } from "@/lib/validations/task";

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
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      organizationId: null,
      projectId: null,
      priority: null,
      status: "not_started",
      dueDate: null,
      dueTime: null,
      description: null,
    },
  });

  const { watch, setValue } = form;
  const organizationId = watch("organizationId");
  const projectId = watch("projectId");
  const isEditing = isCreating || form.formState.isDirty;

  // Filter projects by selected organization
  const filteredProjects = organizationId 
    ? projects.filter(p => p.organizationId === organizationId)
    : projects;

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      form.reset({
        name: task.name,
        organizationId: task.organizationId,
        projectId: task.projectId,
        priority: task.priority as TaskFormValues["priority"],
        status: task.status as TaskFormValues["status"],
        dueDate: task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : null,
        dueTime: task.dueTime,
        description: task.description || null,
      });
    } else if (isCreating) {
      form.reset({
        name: "",
        organizationId: null,
        projectId: null,
        priority: null,
        status: "not_started",
        dueDate: defaultDate ? format(defaultDate, "yyyy-MM-dd") : null,
        dueTime: null,
        description: null,
      });
    }
  }, [task, isCreating, defaultDate, form]);

  // Clear project if organization changes and project doesn't belong to new org
  useEffect(() => {
    if (organizationId && projectId) {
      const selectedProject = projects.find(p => p.id === projectId);
      if (selectedProject && selectedProject.organizationId !== organizationId) {
        setValue("projectId", null);
      }
    }
  }, [organizationId, projectId, projects, setValue]);

  const onSubmit = async (values: TaskFormValues) => {
    let finalDueDate = values.dueDate;
    if (isCreating && !finalDueDate && defaultDate) {
      finalDueDate = format(defaultDate, "yyyy-MM-dd");
    }
    
    await onSave({
      id: task?.id,
      name: values.name,
      organizationId: values.organizationId,
      projectId: values.projectId,
      priority: values.priority,
      status: values.status,
      dueDate: finalDueDate,
      dueTime: values.dueTime,
      description: values.description,
    });
    onClose();
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
                {isCreating ? "New Task" : "Edit Task"}
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
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            {/* Task Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Organization & Project */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select organization..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="projectId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select project..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {filteredProjects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Status & Priority */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select
                      value={field.value || "none"}
                      onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {PRIORITIES.map((p) => (
                          <SelectItem key={p.value} value={p.value}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Time</FormLabel>
                    <FormControl>
                      <Input
                        type="time"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <RichEditor
                      content={field.value || ""}
                      onChange={(value) => field.onChange(value || null)}
                      placeholder="Add task description..."
                      className="min-h-[120px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div>
                {task && (
                  <Button
                    type="button"
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
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? "Saving..." : isCreating ? "Create" : "Save"}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
