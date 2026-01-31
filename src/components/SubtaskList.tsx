"use client";

import { useState, useCallback } from "react";
import { Circle, CheckCircle2, Clock, AlertCircle, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Subtask = {
  id: string;
  name: string;
  status: string;
  description?: string | null;
};

interface SubtaskListProps {
  parentId: string;
  subtasks: Subtask[];
  onSubtaskClick?: (subtask: Subtask) => void;
  onStatusChange: (subtaskId: string, status: string) => Promise<void>;
  onSubtaskCreated: () => void;
}

function getStatusIcon(status: string) {
  switch (status) {
    case "done":
      return <CheckCircle2 size={14} className="text-green-400" />;
    case "in_progress":
      return <Clock size={14} className="text-blue-400" />;
    case "waiting":
      return <AlertCircle size={14} className="text-amber-400" />;
    default:
      return <Circle size={14} className="text-[var(--text-quaternary)]" />;
  }
}

export function SubtaskList({
  parentId,
  subtasks,
  onSubtaskClick,
  onStatusChange,
  onSubtaskCreated,
}: SubtaskListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newSubtaskName, setNewSubtaskName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const completedCount = subtasks.filter((s) => s.status === "done").length;
  const totalCount = subtasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const cycleStatus = useCallback(
    async (e: React.MouseEvent, subtask: Subtask) => {
      e.stopPropagation();
      const statuses = ["not_started", "in_progress", "waiting", "done"];
      const currentIndex = statuses.indexOf(subtask.status);
      const nextStatus = statuses[(currentIndex + 1) % statuses.length];
      await onStatusChange(subtask.id, nextStatus);
    },
    [onStatusChange]
  );

  const handleAddSubtask = useCallback(async () => {
    if (!newSubtaskName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch(`/api/tasks/${parentId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtasks: [{ name: newSubtaskName.trim() }],
        }),
      });

      if (!res.ok) throw new Error("Failed to create subtask");

      setNewSubtaskName("");
      setIsAdding(false);
      onSubtaskCreated();
      toast.success("Subtask added");
    } catch {
      toast.error("Failed to add subtask");
    } finally {
      setIsCreating(false);
    }
  }, [parentId, newSubtaskName, isCreating, onSubtaskCreated]);

  return (
    <div className="space-y-2">
      {/* Header with progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Subtasks
          </span>
          {totalCount > 0 && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {completedCount}/{totalCount}
            </span>
          )}
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-[var(--bg-surface)] rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-[var(--text-quaternary)]">{progress}%</span>
          </div>
        )}
      </div>

      {/* Subtask list */}
      {subtasks.length > 0 && (
        <div className="space-y-1 bg-[var(--bg-surface)] rounded-lg border border-[var(--border-default)] divide-y divide-[var(--border-default)]">
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              onClick={() => onSubtaskClick?.(subtask)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 hover:bg-[var(--bg-hover)] cursor-pointer transition-colors",
                subtask.status === "done" && "opacity-50"
              )}
            >
              <button
                onClick={(e) => cycleStatus(e, subtask)}
                className="hover:opacity-70 transition-opacity shrink-0"
              >
                {getStatusIcon(subtask.status)}
              </button>
              <span
                className={cn(
                  "text-sm flex-1",
                  subtask.status === "done"
                    ? "text-[var(--text-tertiary)] line-through"
                    : "text-[var(--text-primary)]"
                )}
              >
                {subtask.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add subtask */}
      {isAdding ? (
        <div className="flex items-center gap-2">
          <Input
            value={newSubtaskName}
            onChange={(e) => setNewSubtaskName(e.target.value)}
            placeholder="Subtask name..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddSubtask();
              if (e.key === "Escape") {
                setIsAdding(false);
                setNewSubtaskName("");
              }
            }}
            disabled={isCreating}
            className="flex-1 h-8 text-sm"
          />
          <Button
            size="sm"
            onClick={handleAddSubtask}
            disabled={!newSubtaskName.trim() || isCreating}
          >
            {isCreating ? <Loader2 size={14} className="animate-spin" /> : "Add"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsAdding(false);
              setNewSubtaskName("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          onClick={() => setIsAdding(true)}
        >
          <Plus size={14} className="mr-2" />
          Add subtask
        </Button>
      )}
    </div>
  );
}
