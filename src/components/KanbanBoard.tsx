"use client";

import { useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import { Circle, Clock, AlertCircle, CheckCircle2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import Breadcrumb from "./Breadcrumb";
import { Organization, Project as SchemaProject } from "@/lib/db/schema";

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

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: string) => void;
  onTaskClick: (task: Task) => void;
  projects: SchemaProject[];
  organizations: Organization[];
}

const COLUMNS = [
  { id: "not_started", label: "Todo", icon: Circle, color: "text-[var(--text-quaternary)]" },
  { id: "in_progress", label: "In Progress", icon: Clock, color: "text-blue-400" },
  { id: "waiting", label: "Waiting", icon: AlertCircle, color: "text-amber-400" },
  { id: "done", label: "Done", icon: CheckCircle2, color: "text-green-500" },
];

function getPriorityBadge(priority: string | null) {
  if (!priority) return null;

  const config: Record<string, { label: string; bg: string; text: string; border: string }> = {
    "non-negotiable": {
      label: "NN",
      bg: "bg-red-500/15",
      text: "text-red-400",
      border: "border-red-500/30",
    },
    critical: {
      label: "Crit",
      bg: "bg-rose-500/15",
      text: "text-rose-400",
      border: "border-rose-500/30",
    },
    high: {
      label: "High",
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30",
    },
    medium: {
      label: "Med",
      bg: "bg-yellow-500/15",
      text: "text-yellow-400",
      border: "border-yellow-500/30",
    },
    low: {
      label: "Low",
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
    },
  };

  const { label, bg, text, border } = config[priority] || {
    label: priority,
    bg: "bg-[var(--bg-surface)]",
    text: "text-[var(--text-quaternary)]",
    border: "border-[var(--border-default)]",
  };

  return (
    <span
      className={cn(
        "text-[9px] px-1.5 py-0.5 rounded border whitespace-nowrap font-medium",
        bg,
        text,
        border
      )}
    >
      {label}
    </span>
  );
}

function TaskCard({
  task,
  onClick,
  isDragging,
}: {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isBeingDragged = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "group bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-lg p-3 cursor-pointer transition-all",
        "hover:border-[var(--border-strong)] hover:bg-[var(--bg-hover)]",
        isBeingDragged && "opacity-50 shadow-lg shadow-black/20 border-[var(--accent-primary)]/50",
        task.status === "done" && "opacity-50"
      )}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)]"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm font-medium text-[var(--text-primary)] truncate",
              task.status === "done" && "line-through text-[var(--text-tertiary)]"
            )}
          >
            {task.name}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {getPriorityBadge(task.priority)}
            {task.dueDate && (
              <span className="text-[10px] text-[var(--text-quaternary)]">
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
          {(task.project || task.organization) && (
            <div className="mt-2">
              <Breadcrumb
                organization={task.organization}
                project={task.project}
                className="text-[10px]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TaskCardOverlay({ task }: { task: Task }) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--accent-primary)]/50 rounded-lg p-3 shadow-xl shadow-black/30 cursor-grabbing">
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-[var(--text-tertiary)]">
          <GripVertical size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {task.name}
          </p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            {getPriorityBadge(task.priority)}
            {task.dueDate && (
              <span className="text-[10px] text-[var(--text-quaternary)]">
                {format(new Date(task.dueDate), "MMM d")}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({
  column,
  tasks,
  onTaskClick,
}: {
  column: (typeof COLUMNS)[0];
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}) {
  const Icon = column.icon;

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] flex-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon size={14} className={column.color} />
        <span className="text-xs font-medium text-[var(--text-secondary)]">
          {column.label}
        </span>
        <span className="text-[10px] text-[var(--text-quaternary)] bg-[var(--bg-surface)] px-1.5 py-0.5 rounded">
          {tasks.length}
        </span>
      </div>
      <div className="flex-1 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] p-2 min-h-[200px] overflow-y-auto">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
              />
            ))}
            {tasks.length === 0 && (
              <div className="text-center py-8 text-[var(--text-quaternary)] text-xs">
                No tasks
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function KanbanBoard({
  tasks,
  onStatusChange,
  onTaskClick,
}: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByColumn = COLUMNS.reduce(
    (acc, column) => {
      acc[column.id] = tasks.filter((t) => t.status === column.id);
      return acc;
    },
    {} as Record<string, Task[]>
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Check if dropped on a column or a task in a column
    let targetStatus: string | null = null;

    // First check if over is a column id
    if (COLUMNS.find((c) => c.id === over.id)) {
      targetStatus = over.id as string;
    } else {
      // Otherwise find which column the target task is in
      const targetTask = tasks.find((t) => t.id === over.id);
      if (targetTask) {
        targetStatus = targetTask.status;
      }
    }

    if (targetStatus && targetStatus !== task.status) {
      onStatusChange(taskId, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {COLUMNS.map((column) => (
          <Column
            key={column.id}
            column={column}
            tasks={tasksByColumn[column.id] || []}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCardOverlay task={activeTask} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
