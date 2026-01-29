"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, X, Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { RichEditor } from "./RichEditor";
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  CollisionDetection,
} from "@dnd-kit/core";
import {
  useSortable,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  subWeeks,
  isSameDay,
} from "date-fns";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;  // ISO string from server
  dueTime: string | null;
  duration: number | null;  // Duration in minutes
  tags: string | null;
  description: string | null;
};

type Project = {
  id: string;
  name: string;
  color: string | null;
};

interface CalendarViewProps {
  tasks: Task[];
  projects: Project[];
}

const PRIORITIES = [
  { value: "critical", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const STATUSES = [
  { value: "not_started", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting", label: "Waiting" },
  { value: "done", label: "Done" },
];

// Hours to display (6 AM to 10 PM)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6);

// Enhanced collision detection with better prioritization
const hourSlotCollision: CollisionDetection = (args) => {
  // Start with pointer-based detection for accuracy
  const pointerCollisions = pointerWithin(args);
  
  if (pointerCollisions.length === 0) {
    // Fall back to center-based detection if no pointer collisions
    return closestCenter(args);
  }
  
  // Prioritize specific drop zones in order of preference:
  
  // 1. Hour slots (YYYY-MM-DD-HH format) - highest priority for timed drops
  const hourSlots = pointerCollisions.filter(c => 
    typeof c.id === "string" && /^\d{4}-\d{2}-\d{2}-\d{2}$/.test(c.id as string)
  );
  
  if (hourSlots.length > 0) {
    // Return closest hour slot if multiple
    return hourSlots.length === 1 ? hourSlots : [hourSlots[0]];
  }
  
  // 2. Day columns (YYYY-MM-DD format) - for untimed/all-day section
  const dayColumns = pointerCollisions.filter(c => 
    typeof c.id === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.id as string)
  );
  
  if (dayColumns.length > 0) {
    return [dayColumns[0]];
  }
  
  // 3. Fall back to closest center if no specific zones match
  return closestCenter(args);
};

function formatHour(hour: number): string {
  if (hour === 0) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function formatTime12h(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12}${period}` : `${hour12}:${minutes.toString().padStart(2, "0")}${period}`;
}

function getTimePosition(time: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  const hourOffset = hours - 6;
  if (hourOffset < 0 || hourOffset >= 17) return null;
  return (hourOffset + minutes / 60) / 17 * 100;
}

// Calculate height percentage based on duration
function getDurationHeight(duration: number | null): number {
  // Default to 30 min if no duration
  const mins = duration || 30;
  // Each hour is 100/17 = ~5.88% of the grid
  return (mins / 60) / 17 * 100;
}

// Draggable Task Item for time grid with resize
function TimeGridTask({
  task,
  onClick,
  onResize,
  isSelected,
  registerRef,
}: {
  task: Task;
  onClick: () => void;
  onResize?: (taskId: string, newDuration: number) => void;
  isSelected?: boolean;
  registerRef?: (taskId: string, element: HTMLElement | null) => void;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [initialDuration, setInitialDuration] = useState(task.duration || 30);
  const containerRef = useRef<HTMLDivElement>(null);
  const justResizedRef = useRef(false); // Track if we just finished resizing to prevent click
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, disabled: isResizing });

  const heightPercent = getDurationHeight(task.duration);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    justResizedRef.current = true;
    setResizeStartY(e.clientY);
    setInitialDuration(task.duration || 30);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Calculate how much the mouse moved
      const deltaY = e.clientY - resizeStartY;
      
      // Get the grid height (600px)
      const gridHeight = 600;
      const hourHeight = gridHeight / 17;
      
      // Convert pixels to minutes (1 hour = hourHeight pixels)
      const deltaMinutes = (deltaY / hourHeight) * 60;
      
      // Calculate new duration (snap to 15 min increments)
      const newDuration = Math.max(15, Math.round((initialDuration + deltaMinutes) / 15) * 15);
      
      // Update duration via callback
      if (onResize && newDuration !== task.duration) {
        onResize(task.id, newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      // Keep justResizedRef true briefly to block the click event
      setTimeout(() => {
        justResizedRef.current = false;
      }, 100);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing, resizeStartY, initialDuration, task.id, task.duration, onResize]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isResizing ? "none" : transition,
    opacity: isDragging ? 0.5 : 1,
    height: `${heightPercent}%`,
    minHeight: "24px",
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
        registerRef?.(task.id, node);
      }}
      style={style}
      {...attributes}
      {...(isResizing ? {} : listeners)}
      data-task-item
      onClick={(e) => {
        if (!isResizing && !justResizedRef.current) {
          e.stopPropagation();
          onClick();
        }
      }}
      className={cn(
        "absolute left-1 right-1 px-2 py-1 rounded text-[10px] cursor-grab active:cursor-grabbing transition-colors overflow-hidden border-l-2 group",
        isDragging ? "bg-[#222] z-50" : "bg-[#1f1f1f] hover:bg-[#262626]",
        isResizing && "z-50 ring-2 ring-blue-500/50",
        isSelected && !isResizing && "ring-2 ring-blue-500/50 bg-blue-500/20",
        task.status === "done" && "opacity-50",
        task.priority === "critical" && "border-l-red-500/70",
        task.priority === "high" && "border-l-amber-500/70",
        !task.priority && "border-l-blue-500/50"
      )}
    >
      <div className="font-medium text-[#e5e5e5] truncate">{task.name}</div>
      {task.dueTime && (
        <span className="text-[9px] text-[#737373]">{formatTime12h(task.dueTime)}</span>
      )}
      
      {/* Resize handle - larger hit area, prevents drag */}
      <div 
        onMouseDown={(e) => {
          e.stopPropagation();
          handleResizeStart(e);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize bg-transparent hover:bg-blue-500/30 transition-colors z-10"
      >
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full bg-[#525252] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    </div>
  );
}

// Untimed task item (top of day)
function UntimedTask({
  task,
  onClick,
  isSelected,
  registerRef,
}: {
  task: Task;
  onClick: () => void;
  isSelected?: boolean;
  registerRef?: (taskId: string, element: HTMLElement | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        registerRef?.(task.id, node);
      }}
      style={style}
      {...attributes}
      {...listeners}
      data-task-item
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px] cursor-grab hover:bg-[#1a1a1a] truncate group",
        isDragging && "opacity-50 bg-[#1a1a1a]",
        isSelected && "ring-2 ring-blue-500/50 bg-blue-500/10",
      )}
    >
      <div className={cn(
        "w-3 h-3 rounded-full border flex-shrink-0",
        task.priority === "critical" && "border-red-500/70",
        task.priority === "high" && "border-amber-500/70",
        task.priority === "medium" && "border-blue-500/50",
        !task.priority && "border-[#404040]"
      )} />
      <span className="truncate text-[#a3a3a3] group-hover:text-[#e5e5e5]">{task.name}</span>
    </div>
  );
}

// Enhanced hour drop zone with better visual feedback
function HourDropZone({ dateKey, hour }: { dateKey: string; hour: number }) {
  const slotId = `${dateKey}-${hour.toString().padStart(2, "0")}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: slotId });
  
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "absolute left-0 right-0 transition-all duration-200 ease-out",
        isOver && active && "bg-blue-500/20 border-2 border-dashed border-blue-400/60 border-l-0 border-r-0",
        !isOver && active && "hover:bg-blue-500/10"
      )}
      style={{ 
        top: `${((hour - 6) / 17) * 100}%`, 
        height: `${100 / 17}%` 
      }}
    >
      {/* Optional: Show drop hint */}
      {isOver && active && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-[9px] text-blue-400 bg-blue-900/80 px-2 py-1 rounded">
            Drop to schedule at {formatHour(hour)}
          </div>
        </div>
      )}
    </div>
  );
}

// Time-blocking Day Column
function TimeBlockDay({
  day,
  timedTasks,
  allDayTasks,
  isCurrentDay,
  onTaskClick,
  onDayClick,
  onResize,
  selectedTaskIds,
  registerRef,
}: {
  day: Date;
  timedTasks: Task[];
  allDayTasks: Task[];
  isCurrentDay: boolean;
  onTaskClick: (task: Task) => void;
  onDayClick: (date: Date) => void;
  onResize: (taskId: string, duration: number) => void;
  selectedTaskIds: Set<string>;
  registerRef: (taskId: string, element: HTMLElement | null) => void;
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  const { setNodeRef: setDayRef, isOver: isDayOver } = useDroppable({
    id: dateKey,
  });

  return (
    <div 
      className={cn(
        "flex-1 min-w-[140px] border-r border-[#1a1a1a] last:border-r-0 flex flex-col",
      )}
    >
      {/* Day Header */}
      <div className={cn(
        "px-2 py-2 text-center border-b border-[#1a1a1a] sticky top-0 bg-[#111] z-10",
        isCurrentDay && "bg-[#1a1a1a]"
      )}>
        <div className="text-[9px] text-[#404040] uppercase tracking-widest">
          {format(day, "EEE")}
        </div>
        <div className={cn(
          "text-lg font-medium mt-0.5",
          isCurrentDay ? "text-blue-400" : "text-[#737373]"
        )}>
          {format(day, "d")}
        </div>
      </div>

      {/* Untimed tasks section (top of day) - droppable for removing time */}
      <div 
        ref={setDayRef}
        className={cn(
          "px-0.5 py-1 border-b border-[#1a1a1a] space-y-0 bg-[#0c0c0c] min-h-[32px] max-h-[120px] overflow-y-auto transition-all duration-200",
          isDayOver && "bg-blue-500/15 border-blue-400/30"
        )}
      >
        {allDayTasks.length > 0 ? (
          <SortableContext items={allDayTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
            {allDayTasks.map((task) => (
              <UntimedTask
                key={task.id}
                task={task}
                onClick={() => onTaskClick(task)}
                isSelected={selectedTaskIds.has(task.id)}
                registerRef={registerRef}
              />
            ))}
          </SortableContext>
        ) : (
          <div className="text-[9px] text-[#333] text-center py-1">All day</div>
        )}
      </div>

      {/* Time grid */}
      <div 
        className="relative h-[600px]"
        onClick={() => onDayClick(day)}
      >
        {/* Hour drop zones (invisible, just for drop detection) */}
        {HOURS.map((hour) => (
          <HourDropZone key={hour} dateKey={dateKey} hour={hour} />
        ))}

        {/* Hour grid lines (visual only) */}
        {HOURS.map((hour, idx) => (
          <div
            key={`line-${hour}`}
            className="absolute left-0 right-0 border-t border-[#1a1a1a]/50 pointer-events-none"
            style={{ top: `${(idx / 17) * 100}%`, height: `${100 / 17}%` }}
          />
        ))}

        {/* Current time indicator */}
        {isCurrentDay && (() => {
          const now = new Date();
          const hours = now.getHours();
          const minutes = now.getMinutes();
          const hourOffset = hours - 6;
          if (hourOffset >= 0 && hourOffset < 17) {
            const position = (hourOffset + minutes / 60) / 17 * 100;
            return (
              <div 
                className="absolute left-0 right-0 z-20 pointer-events-none"
                style={{ top: `${position}%` }}
              >
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 -ml-1" />
                  <div className="flex-1 h-[2px] bg-red-500" />
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Tasks positioned by time */}
        <SortableContext items={timedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {timedTasks.map((task) => {
            const position = getTimePosition(task.dueTime);
            if (position === null) return null;
            return (
              <div
                key={task.id}
                className="absolute left-0 right-0"
                style={{ top: `${position}%` }}
              >
                <TimeGridTask
                  task={task}
                  onClick={() => onTaskClick(task)}
                  onResize={onResize}
                  isSelected={selectedTaskIds.has(task.id)}
                  registerRef={registerRef}
                />
              </div>
            );
          })}
        </SortableContext>
      </div>
    </div>
  );
}

// Task Side Panel
function TaskSidePanel({
  task,
  projects,
  isOpen,
  isCreating,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}: {
  task: Task | null;
  projects: Project[];
  isOpen: boolean;
  isCreating: boolean;
  defaultDate: Date | null;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [priority, setPriority] = useState<string | null>(null);
  const [status, setStatus] = useState("not_started");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [description, setDescription] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (task) {
      setName(task.name);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : "");
      setDueTime(task.dueTime || "");
      setDescription(task.description || "");
      setShowDescription(!!task.description);
      setIsEditing(false);
    } else if (isCreating) {
      setName("");
      setPriority(null);
      setStatus("not_started");
      setDueDate(defaultDate ? format(defaultDate, "yyyy-MM-dd") : "");
      setDueTime("");
      setDescription("");
      setShowDescription(false);
      setIsEditing(true);
    }
  }, [task, isCreating, defaultDate]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        id: task?.id,
        name,
        priority,
        status,
        dueDate: dueDate || null,  // Keep as string, API will handle conversion
        dueTime: dueTime || null,
        description: description || null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task?.id) return;
    if (!confirm("Delete this task?")) return;
    await onDelete(task.id);
    onClose();
  };

  const getStatusLabel = (s: string) => STATUSES.find(st => st.value === s)?.label || s;
  const getPriorityLabel = (p: string | null) => PRIORITIES.find(pr => pr.value === p)?.label || "None";

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[420px] bg-[#0c0c0c] border-l border-[#1a1a1a] z-50 transform transition-transform duration-300 ease-out overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a] sticky top-0 bg-[#0c0c0c] z-10">
          <span className="font-display text-lg text-[#f5f5f5]">
            {isCreating ? "New Task" : isEditing ? "Edit Task" : "Task Details"}
          </span>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#404040] hover:text-[#737373] hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {isEditing || isCreating ? (
            <>
              {/* Name */}
              <div>
                <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Task Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#f5f5f5] text-sm placeholder:text-[#333] focus:outline-none focus:border-[#404040] transition-colors"
                  autoFocus
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Priority</label>
                  <select
                    value={priority || ""}
                    onChange={(e) => setPriority(e.target.value || null)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  >
                    <option value="">None</option>
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Time</label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                  />
                </div>
              </div>

              {/* Description Toggle */}
              <button
                type="button"
                onClick={() => setShowDescription(!showDescription)}
                className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-[#737373] transition-colors"
              >
                {showDescription ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {showDescription ? "Hide description" : "Add description"}
              </button>

              {/* Description Editor */}
              {showDescription && (
                <div>
                  <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Description</label>
                  <RichEditor
                    content={description}
                    onChange={setDescription}
                    placeholder="Add details, notes, or context..."
                    className="max-h-48 overflow-y-auto"
                  />
                </div>
              )}
            </>
          ) : task && (
            <>
              {/* View Mode */}
              <div>
                <h2 className="font-display text-xl text-[#f5f5f5] mb-4">{task.name}</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider">Status</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      task.status === "done" && "bg-green-500/10 text-green-400",
                      task.status === "in_progress" && "bg-blue-500/10 text-blue-400",
                      task.status === "waiting" && "bg-amber-500/10 text-amber-400",
                      task.status === "not_started" && "bg-[#1a1a1a] text-[#737373]"
                    )}>
                      {getStatusLabel(task.status)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider">Priority</span>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded",
                      task.priority === "critical" && "bg-red-500/10 text-red-400",
                      task.priority === "high" && "bg-amber-500/10 text-amber-400",
                      task.priority === "medium" && "bg-blue-500/10 text-blue-400",
                      !task.priority && "text-[#525252]"
                    )}>
                      {getPriorityLabel(task.priority)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider">Due Date</span>
                    <span className="text-sm text-[#a3a3a3]">
                      {task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "—"}
                    </span>
                  </div>

                  {task.dueTime && (
                    <div className="flex items-center justify-between py-3 border-b border-[#1a1a1a]">
                      <span className="text-[11px] text-[#525252] uppercase tracking-wider">Time</span>
                      <span className="text-sm text-[#a3a3a3]">{task.dueTime}</span>
                    </div>
                  )}
                </div>

                {task.description && (
                  <div className="mt-6">
                    <span className="text-[11px] text-[#525252] uppercase tracking-wider block mb-3">Description</span>
                    <div 
                      className="text-sm text-[#a3a3a3] prose prose-invert prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: task.description }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0c0c0c] border-t border-[#1a1a1a] px-6 py-4">
          {isEditing || isCreating ? (
            <div className="flex items-center justify-between">
              {task && !isCreating ? (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
              ) : (
                <div />
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (isCreating) {
                      onClose();
                    } else {
                      setIsEditing(false);
                    }
                  }}
                  className="text-[11px] text-[#525252] hover:text-[#a3a3a3] px-4 py-2 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!name.trim() || saving}
                  className="text-[11px] text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors font-medium"
                >
                  {saving ? "Saving..." : isCreating ? "Create" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-red-400 transition-colors"
              >
                <Trash2 size={13} />
                Delete
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[11px] text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5] px-5 py-2 rounded-lg transition-colors font-medium"
              >
                Edit Task
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Selection box component
function SelectionBox({
  start,
  end,
  containerRef
}: {
  start: { x: number; y: number };
  end: { x: number; y: number };
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!containerRef.current) return null;

  const rect = containerRef.current.getBoundingClientRect();
  const left = Math.min(start.x, end.x) - rect.left;
  const top = Math.min(start.y, end.y) - rect.top;
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      className="absolute pointer-events-none border-2 border-blue-500/50 bg-blue-500/10 z-50"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}

// Main Calendar View
export function CalendarView({ tasks, projects }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createDate, setCreateDate] = useState<Date | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  // Marquee selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const taskElementsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Optimistic updates: track moved tasks locally until server syncs
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, { date: string; time: string | null }>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require 8px movement before drag starts (prevents accidental drags)
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      // Require 250ms hold before drag on touch devices
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Clear optimistic moves and selection when tasks prop changes (server synced)
  useEffect(() => {
    setOptimisticMoves(new Map());
    setSelectedTaskIds(new Set());
  }, [tasks]);

  // Register task element for intersection detection
  const registerTaskElement = useCallback((taskId: string, element: HTMLElement | null) => {
    if (element) {
      taskElementsRef.current.set(taskId, element);
    } else {
      taskElementsRef.current.delete(taskId);
    }
  }, []);

  // Check if a rect intersects with the selection box
  const rectsIntersect = useCallback((
    selStart: { x: number; y: number },
    selEnd: { x: number; y: number },
    elementRect: DOMRect
  ) => {
    const selLeft = Math.min(selStart.x, selEnd.x);
    const selRight = Math.max(selStart.x, selEnd.x);
    const selTop = Math.min(selStart.y, selEnd.y);
    const selBottom = Math.max(selStart.y, selEnd.y);

    return !(
      elementRect.right < selLeft ||
      elementRect.left > selRight ||
      elementRect.bottom < selTop ||
      elementRect.top > selBottom
    );
  }, []);

  // Calculate which tasks are inside the selection box
  const updateSelection = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const newSelected = new Set<string>();

    taskElementsRef.current.forEach((element, taskId) => {
      const rect = element.getBoundingClientRect();
      if (rectsIntersect(start, end, rect)) {
        newSelected.add(taskId);
      }
    });

    setSelectedTaskIds(newSelected);
  }, [rectsIntersect]);

  // Marquee selection mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on left click on empty space
    if (e.button !== 0) return;

    // Check if clicking on a task or interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-task-item]') ||
      target.closest('button') ||
      target.closest('[data-no-select]')
    ) {
      return;
    }

    // Start selection
    setIsSelecting(true);
    setSelectionStart({ x: e.clientX, y: e.clientY });
    setSelectionEnd({ x: e.clientX, y: e.clientY });
    setSelectedTaskIds(new Set());
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isSelecting || !selectionStart) return;

    const newEnd = { x: e.clientX, y: e.clientY };
    setSelectionEnd(newEnd);
    updateSelection(selectionStart, newEnd);
  }, [isSelecting, selectionStart, updateSelection]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelecting]);

  // Global mouse up listener to handle mouse up outside the container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isSelecting]);

  // Clear selection on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedTaskIds(new Set());
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Group tasks by date, with optimistic overrides applied
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { timed: Task[]; allDay: Task[] }>();
    
    tasks.forEach((task) => {
      // Check for optimistic move
      const optimistic = optimisticMoves.get(task.id);
      const effectiveDate = optimistic?.date || (task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : null);
      const effectiveTime = optimistic ? optimistic.time : task.dueTime;
      
      if (effectiveDate) {
        const existing = map.get(effectiveDate) || { timed: [], allDay: [] };
        // Create a modified task with optimistic values
        const effectiveTask = optimistic 
          ? { ...task, dueDate: effectiveDate, dueTime: effectiveTime }
          : task;
        
        if (effectiveTime) {
          existing.timed.push(effectiveTask);
        } else {
          existing.allDay.push(effectiveTask);
        }
        map.set(effectiveDate, existing);
      }
    });
    return map;
  }, [tasks, optimisticMoves]);

  const handleTaskClick = useCallback((task: Task) => {
    setSelectedTask(task);
    setIsCreating(false);
    setIsPanelOpen(true);
  }, []);

  const handleDayClick = useCallback((date: Date) => {
    setCreateDate(date);
    setSelectedTask(null);
    setIsCreating(true);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedTask(null);
    setIsCreating(false);
    setCreateDate(null);
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
    await fetch(`/api/tasks/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }, [router]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);

    // If dragging a non-selected task, clear selection and only drag that one
    if (task && !selectedTaskIds.has(task.id)) {
      setSelectedTaskIds(new Set([task.id]));
    }
  }, [tasks, selectedTaskIds]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return; // Dropped outside valid area

    const dropTarget = over.id as string;
    const draggedTask = tasks.find(t => t.id === active.id);

    if (!draggedTask) return;

    // Get all tasks to move (either selected tasks or just the dragged one)
    const taskIdsToMove = selectedTaskIds.has(draggedTask.id)
      ? Array.from(selectedTaskIds)
      : [draggedTask.id];

    // Parse drop target to determine new date/time
    const parseDropTarget = (target: string, forTask: Task) => {
      // Hour slot format: YYYY-MM-DD-HH
      const hourSlotMatch = target.match(/^(\d{4}-\d{2}-\d{2})-(\d{2})$/);
      if (hourSlotMatch) {
        const date = hourSlotMatch[1];
        const hour = parseInt(hourSlotMatch[2], 10);
        const time = `${hour.toString().padStart(2, "0")}:00`;
        return { date, time };
      }

      // Day column format: YYYY-MM-DD (removes time - makes it untimed)
      if (/^\d{4}-\d{2}-\d{2}$/.test(target)) {
        return { date: target, time: null };
      }

      // Task-to-task drops: find the date of the target task
      for (const [dateKey, dayData] of tasksByDate.entries()) {
        const allTasks = [...dayData.timed, ...dayData.allDay];
        if (allTasks.some(t => t.id === target)) {
          // Preserve the original task's time when dropping on another task
          return { date: dateKey, time: forTask.dueTime };
        }
      }

      return null;
    };

    const result = parseDropTarget(dropTarget, draggedTask);
    if (!result) return;

    const { date: targetDate, time: targetTime } = result;

    // Move all selected tasks
    const updates: Promise<Response>[] = [];

    for (const taskId of taskIdsToMove) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) continue;

      const currentDateKey = task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : null;
      const dateChanged = currentDateKey !== targetDate;
      const timeChanged = task.dueTime !== targetTime;

      if (dateChanged || timeChanged) {
        // Apply optimistic update
        setOptimisticMoves(prev => new Map(prev).set(task.id, {
          date: targetDate,
          time: targetTime
        }));

        // Prepare update payload
        const updateData: { dueDate?: string; dueTime?: string | null } = {};

        if (dateChanged) {
          updateData.dueDate = new Date(targetDate + "T12:00:00").toISOString();
        }
        if (timeChanged) {
          updateData.dueTime = targetTime;
        }

        // Queue the update
        updates.push(
          fetch(`/api/tasks/${task.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updateData),
          })
        );
      }
    }

    // Execute all updates and refresh
    if (updates.length > 0) {
      Promise.all(updates)
        .then(() => router.refresh())
        .catch(error => {
          console.error('Error updating tasks:', error);
          router.refresh();
        });
    }

    // Clear selection after move
    setSelectedTaskIds(new Set());
  }, [tasks, tasksByDate, selectedTaskIds, router]);

  const handleResize = useCallback((taskId: string, duration: number) => {
    // Fire and forget - UI already updates via the component's local state
    fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ duration }),
    }).then(() => router.refresh());
  }, [router]);

  // Set date on client only to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Don't render until client-side date is set
  if (!currentDate) {
    return (
      <div className="space-y-6">
        <div className="bg-[#111] rounded-lg border border-[#1a1a1a] h-[600px] animate-pulse" />
      </div>
    );
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div className="space-y-6">
      <DndContext
        sensors={sensors}
        collisionDetection={hourSlotCollision}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-[#111] rounded-lg border border-[#1a1a1a]">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
            <h2 className="font-display text-xl text-[#f5f5f5]">
              {format(weekStart, "MMMM yyyy")}
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <ChevronLeft size={16} className="text-[#525252]" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="text-[11px] text-[#525252] hover:text-[#a3a3a3] px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium"
              >
                Today
              </button>
              <button
                onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
                className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors"
              >
                <ChevronRight size={16} className="text-[#525252]" />
              </button>
            </div>
          </div>

          {/* Calendar Grid with Time Labels */}
          <div className="flex overflow-hidden max-h-[calc(100vh-280px)]">
            {/* Time labels column */}
            <div className="w-12 shrink-0 border-r border-[#1a1a1a] flex flex-col bg-[#0c0c0c]">
              {/* Empty header space */}
              <div className="h-[52px] border-b border-[#1a1a1a] shrink-0" />
              {/* Hour labels */}
              <div className="flex-1 relative h-[600px]">
                {HOURS.map((hour, idx) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 px-1 text-[9px] text-[#404040] -translate-y-1/2"
                    style={{ top: `${(idx / 17) * 100}%` }}
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>
            </div>

            {/* Days */}
            <div
              ref={calendarContainerRef}
              className="flex-1 flex overflow-x-auto overflow-y-auto relative"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {weekDays.map((day) => {
                const dayData = tasksByDate.get(format(day, "yyyy-MM-dd")) || { timed: [], allDay: [] };
                const isCurrentDay = isToday(day);

                return (
                  <TimeBlockDay
                    key={day.toISOString()}
                    day={day}
                    timedTasks={dayData.timed}
                    allDayTasks={dayData.allDay}
                    isCurrentDay={isCurrentDay}
                    onTaskClick={handleTaskClick}
                    onDayClick={handleDayClick}
                    onResize={handleResize}
                    selectedTaskIds={selectedTaskIds}
                    registerRef={registerTaskElement}
                  />
                );
              })}

              {/* Selection Box */}
              {isSelecting && selectionStart && selectionEnd && (
                <SelectionBox
                  start={selectionStart}
                  end={selectionEnd}
                  containerRef={calendarContainerRef}
                />
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Drag Overlay with smooth cursor following */}
        <DragOverlay>
          {activeTask ? (
            <div className="relative">
              <div className="text-[11px] px-3 py-2 rounded-lg bg-[#222] text-[#f5f5f5] shadow-2xl border border-[#444] cursor-grabbing transform rotate-2 scale-105 transition-transform">
                <div className="font-medium">{activeTask.name}</div>
                {activeTask.dueTime && (
                  <div className="text-[9px] text-[#999] mt-0.5">
                    {formatTime12h(activeTask.dueTime)}
                  </div>
                )}
              </div>
              {selectedTaskIds.size > 1 && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                  {selectedTaskIds.size}
                </div>
              )}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Task Side Panel */}
      <TaskSidePanel
        task={selectedTask}
        projects={projects}
        isOpen={isPanelOpen}
        isCreating={isCreating}
        defaultDate={createDate}
        onClose={handleClosePanel}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  );
}
