"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragMoveEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  subWeeks,
  setHours,
} from "date-fns";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  duration?: number | null; // Duration in minutes
  tags: string | null;
  description?: string | null;
};

interface TimeWeekCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newDate: Date, newTime?: string) => void;
  onTaskResize?: (taskId: string, newDuration: number) => void;
}

// Hours to display (6am to 10pm)
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22
const HOUR_HEIGHT = 48; // pixels per hour

// Parse time string to minutes from midnight
function parseTimeToMinutes(time: string | null): number | null {
  if (!time) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// Layout info for a task after collision detection
type TaskLayout = {
  task: Task;
  column: number;
  totalColumns: number;
};

// Check if two tasks overlap in time
function tasksOverlap(a: Task, b: Task): boolean {
  const aStart = parseTimeToMinutes(a.dueTime) ?? 0;
  const aEnd = aStart + (a.duration || 30);
  const bStart = parseTimeToMinutes(b.dueTime) ?? 0;
  const bEnd = bStart + (b.duration || 30);
  
  return aStart < bEnd && bStart < aEnd;
}

// Calculate layout positions for overlapping tasks
function calculateTaskLayouts(tasks: Task[]): TaskLayout[] {
  if (tasks.length === 0) return [];
  
  // Sort by start time, then by duration (longer first)
  const sorted = [...tasks].sort((a, b) => {
    const aStart = parseTimeToMinutes(a.dueTime) ?? 0;
    const bStart = parseTimeToMinutes(b.dueTime) ?? 0;
    if (aStart !== bStart) return aStart - bStart;
    return (b.duration || 30) - (a.duration || 30);
  });
  
  const layouts: TaskLayout[] = [];
  const columns: Task[][] = []; // Each column tracks which tasks are in it
  
  for (const task of sorted) {
    // Find the first column where this task doesn't overlap with existing tasks
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const canPlace = columns[col].every(existingTask => !tasksOverlap(task, existingTask));
      if (canPlace) {
        columns[col].push(task);
        layouts.push({ task, column: col, totalColumns: 0 }); // totalColumns filled later
        placed = true;
        break;
      }
    }
    
    // If no existing column works, create a new one
    if (!placed) {
      columns.push([task]);
      layouts.push({ task, column: columns.length - 1, totalColumns: 0 });
    }
  }
  
  // Now calculate totalColumns for each task based on overlapping cluster
  // For each task, find all tasks that overlap with it (directly or transitively)
  const taskToLayout = new Map(layouts.map(l => [l.task.id, l]));
  
  for (const layout of layouts) {
    // Find all tasks that overlap with this one at any point
    const overlappingTasks = layouts.filter(other => 
      other.task.id !== layout.task.id && tasksOverlap(layout.task, other.task)
    );
    
    // The total columns is the max column index + 1 among this task and all overlapping
    const maxCol = Math.max(
      layout.column,
      ...overlappingTasks.map(o => o.column)
    );
    
    layout.totalColumns = maxCol + 1;
  }
  
  // Ensure all overlapping tasks in a cluster share the same totalColumns
  // by doing a second pass to propagate the max
  let changed = true;
  while (changed) {
    changed = false;
    for (const layout of layouts) {
      const overlapping = layouts.filter(other => 
        other.task.id !== layout.task.id && tasksOverlap(layout.task, other.task)
      );
      for (const other of overlapping) {
        if (other.totalColumns !== layout.totalColumns) {
          const max = Math.max(layout.totalColumns, other.totalColumns);
          if (layout.totalColumns !== max || other.totalColumns !== max) {
            layout.totalColumns = max;
            other.totalColumns = max;
            changed = true;
          }
        }
      }
    }
  }
  
  return layouts;
}

// Calculate top position for a time
function getTopPosition(time: string | null): number {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return 0;
  const startMinutes = 6 * 60; // 6am
  return ((minutes - startMinutes) / 60) * HOUR_HEIGHT;
}

// Calculate height from duration
function getHeightFromDuration(duration: number | null | undefined): number {
  const mins = duration || 30; // Default 30 min
  return (mins / 60) * HOUR_HEIGHT;
}

// Format minutes to time string
function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "PM" : "AM";
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

// Convert pixel position to time (snapped to 15 min)
function pixelToTime(pixelY: number): { time: string; displayTime: string } {
  const startMinutes = 6 * 60; // 6am
  const rawMinutes = startMinutes + (pixelY / HOUR_HEIGHT) * 60;
  // Snap to 15 min increments
  const snappedMinutes = Math.round(rawMinutes / 15) * 15;
  const clampedMinutes = Math.max(6 * 60, Math.min(22 * 60, snappedMinutes));
  
  const h = Math.floor(clampedMinutes / 60);
  const m = clampedMinutes % 60;
  
  return {
    time: `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`,
    displayTime: minutesToTimeString(clampedMinutes),
  };
}

// Draggable timed task with resize (positioned absolutely in hour grid)
function TimedTask({
  task,
  onClick,
  onResize,
  onResizePreview,
  style,
  column = 0,
  totalColumns = 1,
}: {
  task: Task;
  onClick?: () => void;
  onResize?: (taskId: string, newDuration: number) => void;
  onResizePreview?: (taskId: string, previewDuration: number | null) => void;
  style?: React.CSSProperties;
  column?: number;
  totalColumns?: number;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [previewDuration, setPreviewDuration] = useState<number | null>(null);
  const justResizedRef = useRef(false);
  const resizeRef = useRef<{
    startY: number;
    initialDuration: number;
    pointerId: number;
  } | null>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isResizing,
  });

  const displayDuration = previewDuration ?? task.duration ?? 30;
  const height = getHeightFromDuration(displayDuration);

  // Pointer-based resize for proper drag behavior
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Capture pointer for reliable tracking
    if (handleRef.current) {
      handleRef.current.setPointerCapture(e.pointerId);
    }
    
    resizeRef.current = {
      startY: e.clientY,
      initialDuration: task.duration || 30,
      pointerId: e.pointerId,
    };
    setIsResizing(true);
    justResizedRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!resizeRef.current || !isResizing) return;
    
    const deltaY = e.clientY - resizeRef.current.startY;
    // Convert pixels to minutes (HOUR_HEIGHT px = 60 min)
    const deltaMinutes = (deltaY / HOUR_HEIGHT) * 60;
    // Snap to 15 min increments, min 15 min
    const newDuration = Math.max(15, Math.round((resizeRef.current.initialDuration + deltaMinutes) / 15) * 15);
    
    setPreviewDuration(newDuration);
    onResizePreview?.(task.id, newDuration);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;
    
    // Release pointer capture
    if (handleRef.current) {
      handleRef.current.releasePointerCapture(e.pointerId);
    }
    
    // Commit the resize if duration changed
    if (previewDuration !== null && onResize && previewDuration !== task.duration) {
      onResize(task.id, previewDuration);
    }
    
    resizeRef.current = null;
    setIsResizing(false);
    setPreviewDuration(null);
    onResizePreview?.(task.id, null);
    
    setTimeout(() => {
      justResizedRef.current = false;
    }, 100);
  };

  // Calculate end time for display
  const startMinutes = parseTimeToMinutes(task.dueTime) || 0;
  const endMinutes = startMinutes + displayDuration;
  const endTimeDisplay = minutesToTimeString(endMinutes);

  // Calculate horizontal position for overlapping tasks
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;
  // Add small gap between overlapping tasks
  const gap = totalColumns > 1 ? 1 : 0; // 1px gap

  return (
    <div
      ref={setNodeRef}
      {...(isResizing ? {} : listeners)}
      {...attributes}
      onClick={(e) => {
        if (!isResizing && !justResizedRef.current) {
          e.stopPropagation();
          onClick?.();
        }
      }}
      style={{ 
        ...style, 
        height: `${height}px`, 
        minHeight: "28px",
        left: `calc(${leftPercent}% + ${gap}px)`,
        width: `calc(${widthPercent}% - ${gap * 2}px)`,
      }}
      className={cn(
        "absolute px-1.5 py-1 rounded text-xs cursor-grab active:cursor-grabbing touch-none overflow-hidden group",
        "bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)]",
        "transition-[height,border-color] duration-75",
        task.status === "done" && "opacity-50",
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500",
        task.priority === "critical" && "border-l-2 border-l-red-500",
        task.priority === "high" && "border-l-2 border-l-amber-500",
        isDragging && "opacity-30 z-50",
        isResizing && "z-50 ring-2 ring-[var(--accent-primary)]/50 cursor-ns-resize"
      )}
    >
      <div className="font-medium truncate text-[var(--text-primary)] text-[11px]">
        {task.name}
      </div>
      {task.dueTime && (
        <div className="text-[10px] text-[var(--text-tertiary)]">
          {task.dueTime.substring(0, 5)}
          {isResizing && (
            <span className="text-[var(--accent-primary)] ml-1">→ {endTimeDisplay}</span>
          )}
        </div>
      )}
      
      {/* Resize handle with visual indicator */}
      {onResize && (
        <div 
          ref={handleRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize bg-transparent hover:bg-[var(--accent-primary)]/10 transition-all z-20 touch-none group/resize flex items-end justify-center"
        >
          {/* Resize indicator bar */}
          <div className="w-8 h-1 rounded-full bg-[var(--border-default)] opacity-0 group-hover:opacity-100 group-hover/resize:opacity-100 group-hover/resize:bg-[var(--accent-primary)] mb-0.5 transition-all" />
        </div>
      )}
      
      {/* Resize time tooltip */}
      {isResizing && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded shadow-lg text-[11px] font-medium text-[var(--accent-primary)] whitespace-nowrap z-50">
          {displayDuration} min → {endTimeDisplay}
        </div>
      )}
    </div>
  );
}

// All-day task (in the all-day row)
function AllDayTask({
  task,
  onClick,
}: {
  task: Task;
  onClick?: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task, isAllDay: true },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={cn(
        "px-1.5 py-0.5 mb-0.5 rounded text-[11px] cursor-grab active:cursor-grabbing touch-none truncate",
        "bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)]",
        task.status === "done" && "opacity-50",
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500",
        isDragging && "opacity-30"
      )}
    >
      <span className="text-[var(--text-primary)]">{task.name}</span>
    </div>
  );
}

// Droppable hour slot
function HourSlot({
  dateKey,
  hour,
}: {
  dateKey: string;
  hour: number;
}) {
  const slotId = `${dateKey}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id: slotId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-t border-[var(--border-subtle)] relative transition-colors",
        isOver && "bg-[var(--accent-primary)]/15"
      )}
      style={{ height: HOUR_HEIGHT }}
    />
  );
}

// Droppable all-day cell
function AllDayCell({
  dateKey,
  tasks,
  onTaskClick,
}: {
  dateKey: string;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `${dateKey}-allday` });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-w-0 border-r border-[var(--border-subtle)] last:border-r-0 px-0.5 py-0.5 transition-colors",
        isOver && "bg-[var(--accent-primary)]/15"
      )}
    >
      {tasks.map((task) => (
        <AllDayTask
          key={task.id}
          task={task}
          onClick={() => onTaskClick?.(task)}
        />
      ))}
    </div>
  );
}

// Ghost preview component for drag
function DragGhostPreview({
  task,
  targetTime,
  targetDate,
}: {
  task: Task;
  targetTime: string | null;
  targetDate: string | null;
}) {
  if (!targetTime || !targetDate) return null;

  const duration = task.duration || 30;
  const height = getHeightFromDuration(duration);
  const startMinutes = parseTimeToMinutes(targetTime) || 0;
  const endMinutes = startMinutes + duration;
  
  return (
    <div 
      className="pointer-events-none"
      style={{ height: `${height}px` }}
    >
      <div className="h-full px-2 py-1 bg-[var(--accent-primary)]/20 border-2 border-dashed border-[var(--accent-primary)] rounded text-xs">
        <div className="font-medium text-[var(--accent-primary)] truncate">{task.name}</div>
        <div className="text-[10px] text-[var(--accent-primary)]">
          {minutesToTimeString(startMinutes)} → {minutesToTimeString(endMinutes)}
        </div>
      </div>
    </div>
  );
}

export function TimeWeekCalendar({
  tasks,
  onTaskClick,
  onTaskMove,
  onTaskResize,
}: TimeWeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ dateKey: string; time: string; displayTime: string } | null>(null);
  const [resizePreview, setResizePreview] = useState<{ taskId: string; duration: number } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Set date on client only
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Scroll to 8am on mount
  useEffect(() => {
    if (scrollRef.current && currentDate) {
      const scrollTo = (8 - 6) * HOUR_HEIGHT; // 8am position
      scrollRef.current.scrollTop = scrollTo;
    }
  }, [currentDate]);

  const weekStart = currentDate
    ? startOfWeek(currentDate, { weekStartsOn: 0 })
    : new Date();
  const weekEnd = currentDate
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : new Date();
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group tasks by date and time
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { timed: Task[]; allDay: Task[] }>();

    weekDays.forEach((day) => {
      map.set(format(day, "yyyy-MM-dd"), { timed: [], allDay: [] });
    });

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const dateKey = format(new Date(task.dueDate), "yyyy-MM-dd");
      const entry = map.get(dateKey);
      if (!entry) return;

      if (task.dueTime) {
        entry.timed.push(task);
      } else {
        entry.allDay.push(task);
      }
    });

    return map;
  }, [tasks, weekDays]);

  // Check if any day has all-day tasks
  const hasAllDayTasks = useMemo(() => {
    for (const [, data] of tasksByDate) {
      if (data.allDay.length > 0) return true;
    }
    return false;
  }, [tasksByDate]);

  // Get max number of all-day tasks for any day
  const maxAllDayTasks = useMemo(() => {
    let max = 0;
    for (const [, data] of tasksByDate) {
      max = Math.max(max, data.allDay.length);
    }
    return max;
  }, [tasksByDate]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) || null,
    [activeId, tasks]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragTarget(null);
  }, []);

  // Track drag position for visual preview
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over, activatorEvent } = event;
    
    if (!over || !gridRef.current) {
      setDragTarget(null);
      return;
    }

    const overId = over.id as string;
    const parts = overId.split("-");
    if (parts.length < 4) {
      setDragTarget(null);
      return;
    }

    const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
    const hourOrAllDay = parts[3];

    if (hourOrAllDay === "allday") {
      setDragTarget({ dateKey, time: "", displayTime: "All day" });
      return;
    }

    // Get mouse position relative to grid for precise time calculation
    const gridRect = gridRef.current.getBoundingClientRect();
    const scrollTop = scrollRef.current?.scrollTop || 0;
    
    // Calculate Y position within the scrollable grid
    const clientY = (activatorEvent as MouseEvent)?.clientY || 0;
    const deltaY = event.delta.y;
    const currentY = clientY + deltaY - gridRect.top + scrollTop;
    
    const { time, displayTime } = pixelToTime(currentY);
    setDragTarget({ dateKey, time, displayTime });
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      
      if (!over || !onTaskMove) {
        setDragTarget(null);
        return;
      }

      const taskId = active.id as string;
      const overId = over.id as string;

      // Parse the drop target: "YYYY-MM-DD-HH" or "YYYY-MM-DD-allday"
      const parts = overId.split("-");
      if (parts.length < 4) {
        setDragTarget(null);
        return;
      }

      const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const hourOrAllDay = parts[3];

      const newDate = new Date(dateKey + "T12:00:00");

      if (hourOrAllDay === "allday") {
        // Dropped on all-day section - clear time
        onTaskMove(taskId, newDate, "");
      } else {
        // Use the precise time from drag target if available
        const newTime = dragTarget?.time || `${parseInt(hourOrAllDay, 10).toString().padStart(2, "0")}:00`;
        onTaskMove(taskId, newDate, newTime);
      }
      
      setDragTarget(null);
    },
    [onTaskMove, dragTarget]
  );

  const handleResizePreview = useCallback((taskId: string, duration: number | null) => {
    if (duration === null) {
      setResizePreview(null);
    } else {
      setResizePreview({ taskId, duration });
    }
  }, []);

  const navigate = (direction: "prev" | "next") => {
    if (!currentDate) return;
    setCurrentDate(
      direction === "prev"
        ? subWeeks(currentDate, 1)
        : addWeeks(currentDate, 1)
    );
  };

  if (!currentDate) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] h-full animate-pulse" />
    );
  }

  // Calculate all-day section height based on content
  const allDayHeight = hasAllDayTasks
    ? Math.min(Math.max(maxAllDayTasks * 24 + 8, 40), 120) // min 40px, max 120px
    : 0;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] shrink-0">
          <h2 className="font-display text-lg text-[var(--text-primary)]">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            >
              <ChevronLeft size={14} className="text-[var(--text-quaternary)]" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-active)] px-3 py-1.5 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-1 hover:bg-[var(--bg-surface)] rounded transition-colors"
            >
              <ChevronRight size={14} className="text-[var(--text-quaternary)]" />
            </button>
          </div>
        </div>

        {/* Day headers (sticky) */}
        <div className="flex border-b border-[var(--border-subtle)] shrink-0">
          {/* Time column spacer */}
          <div className="w-12 shrink-0 border-r border-[var(--border-subtle)]" />
          
          {/* Day headers */}
          {weekDays.map((day) => {
            const isCurrentDay = isToday(day);
            const dateKey = format(day, "yyyy-MM-dd");
            const isTargetDay = dragTarget?.dateKey === dateKey;
            
            return (
              <div
                key={dateKey}
                className={cn(
                  "flex-1 min-w-0 px-2 py-2 text-center border-r border-[var(--border-subtle)] last:border-r-0 transition-colors",
                  isCurrentDay && "bg-[var(--bg-surface)]",
                  isTargetDay && "bg-[var(--accent-primary)]/10"
                )}
              >
                <div className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest">
                  {format(day, "EEE")}
                </div>
                <div
                  className={cn(
                    "text-lg font-display",
                    isCurrentDay
                      ? "text-[var(--text-primary)] font-semibold"
                      : "text-[var(--text-tertiary)]"
                  )}
                >
                  {format(day, "d")}
                </div>
              </div>
            );
          })}
        </div>

        {/* All-day section (if there are any all-day tasks) */}
        {hasAllDayTasks && (
          <div className="flex border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-base)]">
            {/* Label */}
            <div className="w-12 shrink-0 border-r border-[var(--border-subtle)] px-1 py-1 text-[10px] text-[var(--text-quaternary)]">
              All day
            </div>
            
            {/* All-day cells with scrollable content */}
            <div 
              className="flex flex-1 overflow-y-auto"
              style={{ maxHeight: `${allDayHeight}px` }}
            >
              {weekDays.map((day) => {
                const dateKey = format(day, "yyyy-MM-dd");
                const dayData = tasksByDate.get(dateKey);
                return (
                  <AllDayCell
                    key={dateKey}
                    dateKey={dateKey}
                    tasks={dayData?.allDay || []}
                    onTaskClick={onTaskClick}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable time grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          <div ref={gridRef} className="flex min-w-0">
            {/* Time labels */}
            <div className="w-12 shrink-0 border-r border-[var(--border-subtle)]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="border-t border-[var(--border-subtle)] text-[10px] text-[var(--text-quaternary)] text-right pr-2 pt-0.5"
                  style={{ height: HOUR_HEIGHT }}
                >
                  {format(setHours(new Date(), hour), "h a")}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {weekDays.map((day) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayData = tasksByDate.get(dateKey);
              const timedTasks = dayData?.timed || [];
              const isCurrentDay = isToday(day);
              const isTargetDay = dragTarget?.dateKey === dateKey;
              
              // Calculate layouts for overlapping tasks
              const taskLayouts = calculateTaskLayouts(timedTasks);
              const layoutMap = new Map(taskLayouts.map(l => [l.task.id, l]));

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "flex-1 min-w-0 border-r border-[var(--border-subtle)] last:border-r-0 relative",
                    isCurrentDay && "bg-[var(--bg-surface)]/30"
                  )}
                >
                  {/* Hour slots (for drop targets) */}
                  {HOURS.map((hour) => (
                    <HourSlot 
                      key={hour} 
                      dateKey={dateKey} 
                      hour={hour}
                    />
                  ))}

                  {/* Ghost preview when dragging to this day */}
                  {activeTask && isTargetDay && dragTarget?.time && (
                    <div
                      className="absolute left-0.5 right-0.5 pointer-events-none z-40"
                      style={{ top: `${getTopPosition(dragTarget.time)}px` }}
                    >
                      <DragGhostPreview
                        task={activeTask}
                        targetTime={dragTarget.time}
                        targetDate={dateKey}
                      />
                    </div>
                  )}

                  {/* Positioned timed tasks with overlap handling */}
                  {timedTasks.map((task) => {
                    const top = getTopPosition(task.dueTime);
                    // Don't render the task being dragged
                    if (task.id === activeId) return null;
                    
                    const layout = layoutMap.get(task.id);
                    
                    return (
                      <TimedTask
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                        onResize={onTaskResize}
                        onResizePreview={handleResizePreview}
                        column={layout?.column ?? 0}
                        totalColumns={layout?.totalColumns ?? 1}
                        style={{
                          top: `${top}px`,
                        }}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag overlay - follows cursor */}
      <DragOverlay>
        {activeTask ? (
          <div className="px-3 py-2 rounded bg-[var(--bg-active)] shadow-xl border border-[var(--accent-primary)]/50 text-xs text-[var(--text-primary)] cursor-grabbing font-medium max-w-[160px]">
            <div className="truncate">{activeTask.name}</div>
            {dragTarget && (
              <div className="text-[var(--accent-primary)] text-[10px] mt-0.5">
                → {dragTarget.displayTime}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
