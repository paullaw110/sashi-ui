"use client";

import { useState } from "react";
import { X, Trash2, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Organization, Project } from "@/lib/db/schema";

interface BulkActionsBarProps {
  selectedCount: number;
  onCancel: () => void;
  onBulkUpdate: (updates: {
    status?: string;
    priority?: string | null;
    projectId?: string | null;
    organizationId?: string | null;
    dueDate?: string | null;
  }) => Promise<void>;
  onBulkDelete: () => Promise<void>;
  projects: Project[];
  organizations: Organization[];
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

const PRIORITY_OPTIONS = [
  { value: "non-negotiable", label: "Non-Negotiable" },
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function BulkActionsBar({
  selectedCount,
  onCancel,
  onBulkUpdate,
  onBulkDelete,
  projects,
  organizations,
}: BulkActionsBarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handleStatusChange = async (status: string) => {
    await onBulkUpdate({ status });
  };

  const handlePriorityChange = async (priority: string | null) => {
    await onBulkUpdate({ priority });
  };

  const handleProjectChange = async (projectId: string | null) => {
    await onBulkUpdate({ projectId });
  };

  const handleOrgChange = async (organizationId: string | null) => {
    await onBulkUpdate({ organizationId });
  };

  const handleDateChange = async (date: Date | undefined) => {
    setDatePickerOpen(false);
    await onBulkUpdate({ dueDate: date ? format(date, "yyyy-MM-dd") : null });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onBulkDelete();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 animate-in slide-in-from-bottom duration-200">
        <div className="bg-[var(--bg-elevated)] border-t border-[var(--border-default)] px-6 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            {/* Selection count */}
            <div className="flex items-center gap-2 text-sm text-[var(--text-primary)]">
              <CheckSquare size={16} className="text-[var(--accent-primary)]" />
              <span className="font-medium">{selectedCount}</span>
              <span className="text-[var(--text-tertiary)]">
                task{selectedCount !== 1 ? "s" : ""} selected
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Status */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Status
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {STATUS_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Priority
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {PRIORITY_OPTIONS.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onClick={() => handlePriorityChange(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handlePriorityChange(null)}>
                    <span className="text-[var(--text-quaternary)]">Clear priority</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Project */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Project
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                  {projects.map((project) => (
                    <DropdownMenuItem
                      key={project.id}
                      onClick={() => handleProjectChange(project.id)}
                    >
                      {project.name}
                    </DropdownMenuItem>
                  ))}
                  {projects.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => handleProjectChange(null)}>
                    <span className="text-[var(--text-quaternary)]">Clear project</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Organization */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Organization
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="max-h-64 overflow-y-auto">
                  {organizations.map((org) => (
                    <DropdownMenuItem
                      key={org.id}
                      onClick={() => handleOrgChange(org.id)}
                    >
                      {org.icon && <span className="mr-2">{org.icon}</span>}
                      {org.name}
                    </DropdownMenuItem>
                  ))}
                  {organizations.length > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuItem onClick={() => handleOrgChange(null)}>
                    <span className="text-[var(--text-quaternary)]">Clear organization</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Due Date */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <button className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border-default)] hover:border-[var(--border-strong)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                    Due Date
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    onSelect={handleDateChange}
                    initialFocus
                  />
                  <div className="p-2 border-t border-[var(--border-subtle)]">
                    <button
                      onClick={() => handleDateChange(undefined)}
                      className="w-full text-xs text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] py-1.5"
                    >
                      Clear due date
                    </button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Divider */}
              <div className="w-px h-6 bg-[var(--border-default)] mx-1" />

              {/* Delete */}
              <button
                onClick={() => setShowDeleteDialog(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600/10 border border-red-600/20 text-red-400 hover:bg-red-600/20 hover:border-red-600/30 transition-colors"
              >
                <Trash2 size={14} />
                Delete
              </button>

              {/* Cancel */}
              <button
                onClick={onCancel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] transition-colors"
              >
                <X size={14} />
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} task{selectedCount !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. {selectedCount === 1 ? "This task" : "These tasks"} will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
