"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react";
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

type CalendarEvent = {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startDate: string;
  startTime: string | null;
  endTime: string | null;
  isAllDay: boolean;
  color: string;
  recurrenceRule: string | null;
  recurrenceEnd: string | null;
  instanceDate?: number;
  isRecurringInstance?: boolean;
};

interface TimeWeekCalendarProps {
  tasks: Task[];
  events?: CalendarEvent[];
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onTaskClick?: (task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onTaskMove?: (taskId: string, newDate: Date, newTime?: string) => void;
  onEventMove?: (eventId: string, newDate: Date, newTime?: string) => void;
  onTaskResize?: (taskId: string, newDuration: number) => void;
  onEventResize?: (eventId: string, newDuration: number) => void;
  onDragCreate?: (params: { dateKey: string; startTime: string; endTime: string; duration: number }) => void;
}

// Hours to display (full 24 hours)
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0-23
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
  return (minutes / 60) * HOUR_HEIGHT;
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

// Format HH:MM time string to 12-hour format
function formatTime12h(time: string | null): string {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  return minutes === 0 ? `${hour12} ${period}` : `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Convert pixel position to time (snapped to 15 min)
function pixelToTime(pixelY: number): { time: string; displayTime: string } {
  const rawMinutes = (pixelY / HOUR_HEIGHT) * 60;
  // Snap to 15 min increments
  const snappedMinutes = Math.round(rawMinutes / 15) * 15;
  const clampedMinutes = Math.max(0, Math.min(23 * 60 + 45, snappedMinutes));

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
      data-task-id={task.id}
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
        "bg-[var(--bg-surface)] border border-[var(--border-default)]",
        "transition-[height,border-color] duration-75",
        task.status === "done" && "opacity-50",
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500",
        isDragging && "opacity-30 z-50",
        isResizing && "z-50 ring-2 ring-[var(--accent-primary)]/50 cursor-ns-resize"
      )}
    >
      <div className="font-medium truncate text-[var(--text-primary)] text-[11px]">
        {task.name}
      </div>
      {task.dueTime && (
        <div className="text-[10px] text-[var(--text-tertiary)]">
          {formatTime12h(task.dueTime)}
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

// Calculate duration from start and end time
function calculateEventDuration(startTime: string | null, endTime: string | null): number {
  if (!startTime || !endTime) return 60; // Default 1 hour
  const startMins = parseTimeToMinutes(startTime) || 0;
  const endMins = parseTimeToMinutes(endTime) || 0;
  return Math.max(15, endMins - startMins);
}

// Timed event (similar to task but with event styling)
function TimedEvent({
  event,
  onClick,
  onResize,
  onResizePreview,
  style,
  column = 0,
  totalColumns = 1,
}: {
  event: CalendarEvent;
  onClick?: () => void;
  onResize?: (eventId: string, newDuration: number) => void;
  onResizePreview?: (eventId: string, previewDuration: number | null) => void;
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
    id: `event-${event.id}`,
    data: { event, isEvent: true },
    disabled: isResizing,
  });

  const baseDuration = calculateEventDuration(event.startTime, event.endTime);
  const displayDuration = previewDuration ?? baseDuration;
  const height = getHeightFromDuration(displayDuration);

  // Pointer-based resize for proper drag behavior
  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (handleRef.current) {
      handleRef.current.setPointerCapture(e.pointerId);
    }

    resizeRef.current = {
      startY: e.clientY,
      initialDuration: baseDuration,
      pointerId: e.pointerId,
    };
    setIsResizing(true);
    justResizedRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!resizeRef.current || !isResizing) return;

    const deltaY = e.clientY - resizeRef.current.startY;
    const deltaMinutes = (deltaY / HOUR_HEIGHT) * 60;
    const newDuration = Math.max(15, Math.round((resizeRef.current.initialDuration + deltaMinutes) / 15) * 15);

    setPreviewDuration(newDuration);
    onResizePreview?.(event.id, newDuration);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!resizeRef.current) return;

    if (handleRef.current) {
      handleRef.current.releasePointerCapture(e.pointerId);
    }

    if (previewDuration !== null && onResize && previewDuration !== baseDuration) {
      onResize(event.id, previewDuration);
    }

    resizeRef.current = null;
    setIsResizing(false);
    setPreviewDuration(null);
    onResizePreview?.(event.id, null);

    setTimeout(() => {
      justResizedRef.current = false;
    }, 100);
  };

  // Calculate end time for display
  const startMinutes = parseTimeToMinutes(event.startTime) || 0;
  const endMinutes = startMinutes + displayDuration;
  const endTimeDisplay = minutesToTimeString(endMinutes);

  // Calculate horizontal position for overlapping events
  const widthPercent = 100 / totalColumns;
  const leftPercent = column * widthPercent;
  const gap = totalColumns > 1 ? 1 : 0;

  return (
    <div
      ref={setNodeRef}
      data-event-id={event.id}
      {...listeners}
      {...attributes}
      style={{
        ...style,
        height: `${height}px`,
        minHeight: "28px",
        left: `calc(${leftPercent}% + ${gap}px)`,
        width: `calc(${widthPercent}% - ${gap * 2}px)`,
        backgroundColor: `${event.color}20`,
        borderColor: event.color,
      }}
      className={cn(
        "absolute px-1.5 py-1 rounded text-xs cursor-grab active:cursor-grabbing touch-none overflow-hidden group",
        "border-l-2 transition-opacity",
        isDragging && "opacity-30 z-50",
        isResizing && "z-50 ring-2 ring-[var(--accent-primary)]/50 cursor-ns-resize"
      )}
    >
      <div
        className="font-medium truncate text-[11px]"
        style={{ color: event.color }}
      >
        {event.name}
      </div>
      {event.startTime && (
        <div className="text-[10px] opacity-70" style={{ color: event.color }}>
          {formatTime12h(event.startTime)} – {endTimeDisplay}
        </div>
      )}
      {event.location && (
        <div className="text-[10px] opacity-60 truncate" style={{ color: event.color }}>
          {event.location}
        </div>
      )}

      {/* Edit icon - appears on hover */}
      {onClick && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="absolute top-0.5 right-0.5 p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/20 transition-opacity z-30"
          style={{ color: event.color }}
        >
          <Pencil size={12} />
        </button>
      )}

      {/* Resize handle */}
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
          <div
            className="w-8 h-1 rounded-full bg-[var(--border-default)] opacity-0 group-hover:opacity-100 group-hover/resize:opacity-100 group-hover/resize:bg-[var(--accent-primary)] mb-0.5 transition-all"
            style={{ backgroundColor: event.color }}
          />
        </div>
      )}

      {/* Resize tooltip */}
      {isResizing && previewDuration !== null && (
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded shadow-lg text-[11px] font-medium text-[var(--accent-primary)] whitespace-nowrap z-50">
          {previewDuration} min → {endTimeDisplay}
        </div>
      )}
    </div>
  );
}

// All-day event (in the all-day row)
function AllDayEvent({
  event,
  onClick,
}: {
  event: CalendarEvent;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={{
        backgroundColor: `${event.color}20`,
        borderColor: event.color,
      }}
      className="px-1.5 py-0.5 mb-0.5 rounded text-[11px] cursor-pointer truncate border-l-2"
    >
      <span style={{ color: event.color }}>{event.name}</span>
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
        "bg-[var(--bg-surface)] border border-[var(--border-default)]",
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
  const { setNodeRef } = useDroppable({ id: slotId });

  return (
    <div
      ref={setNodeRef}
      className="border-t border-[var(--border-subtle)] relative"
      style={{ height: HOUR_HEIGHT }}
    />
  );
}

// Drop preview overlay - shows dashed outline at exact drop position
function DropPreview({
  time,
  duration,
}: {
  time: string;
  duration: number;
}) {
  const top = getTopPosition(time);
  const height = getHeightFromDuration(duration);

  return (
    <div
      className="absolute left-1 right-1 border-2 border-dashed border-[var(--accent-primary)] rounded bg-[var(--accent-primary)]/5 pointer-events-none z-10"
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: "28px",
      }}
    />
  );
}

// Create selection preview - shows during drag-to-create
function CreateSelectionPreview({
  startTime,
  endTime,
  durationMinutes,
}: {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}) {
  const top = getTopPosition(startTime);
  const height = getHeightFromDuration(durationMinutes);

  return (
    <div
      className="absolute left-1 right-1 rounded-md bg-[var(--accent-primary)]/20 border-2 border-[var(--accent-primary)] pointer-events-none z-30 flex items-start justify-center pt-1"
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 24)}px`,
      }}
    >
      <div className="text-[11px] font-medium text-[var(--accent-primary)] bg-[var(--bg-elevated)] px-2 py-0.5 rounded shadow-sm border border-[var(--border-default)]">
        {minutesToTimeString(parseTimeToMinutes(startTime) || 0)} – {minutesToTimeString(parseTimeToMinutes(endTime) || 0)}
      </div>
    </div>
  );
}

// Hook to get current time position
function useCurrentTimePosition() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const minutesSinceMidnight = hours * 60 + minutes;
  const top = (minutesSinceMidnight / 60) * HOUR_HEIGHT;

  // Format time for badge (e.g., "11:44AM")
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  const timeString = `${displayHour}:${minutes.toString().padStart(2, "0")}${period}`;

  return { top, timeString };
}

// Background line - thin, faded, spans full width with time badge
function CurrentTimeIndicatorBackground() {
  const { top, timeString } = useCurrentTimePosition();

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="flex items-center">
        {/* Time badge - positioned in time column, vertically centered on line */}
        <div className="absolute left-1 top-1/2 -translate-y-1/2 bg-[var(--accent-primary)] text-[var(--bg-base)] text-[10px] font-semibold px-1.5 py-0.5 rounded">
          {timeString}
        </div>
        {/* Thin faded line spans full width */}
        <div className="flex-1 h-px bg-[var(--accent-primary)]/30" />
      </div>
    </div>
  );
}

// Current day line - thick, solid, only for today's column
function CurrentTimeIndicatorLine() {
  const { top } = useCurrentTimePosition();

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      <div className="h-[2px] bg-[var(--accent-primary)]" />
    </div>
  );
}

// Droppable all-day cell
function AllDayCell({
  dateKey,
  tasks,
  events,
  onTaskClick,
  onEventClick,
}: {
  dateKey: string;
  tasks: Task[];
  events: CalendarEvent[];
  onTaskClick?: (task: Task) => void;
  onEventClick?: (event: CalendarEvent) => void;
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
      {events.map((event) => (
        <AllDayEvent
          key={event.id}
          event={event}
          onClick={() => onEventClick?.(event)}
        />
      ))}
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

export function TimeWeekCalendar({
  tasks,
  events = [],
  currentDate: externalDate,
  onDateChange,
  onTaskClick,
  onEventClick,
  onTaskMove,
  onEventMove,
  onTaskResize,
  onEventResize,
  onDragCreate,
}: TimeWeekCalendarProps) {
  // Use external date if provided (controlled), otherwise internal fallback
  const [internalDate, setInternalDate] = useState<Date | null>(null);
  const currentDate = externalDate || internalDate;

  // Wrapper to update both internal state and notify parent
  const updateCurrentDate = useCallback((date: Date) => {
    if (!externalDate) {
      setInternalDate(date);
    }
    onDateChange?.(date);
  }, [externalDate, onDateChange]);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragTarget, setDragTarget] = useState<{ dateKey: string; time: string; displayTime: string } | null>(null);
  const [resizePreview, setResizePreview] = useState<{ taskId: string; duration: number } | null>(null);
  // Track where the user clicked within the task for accurate positioning
  const [dragClickOffset, setDragClickOffset] = useState<number>(0);
  // Optimistic moves to prevent flash on drop
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, { dateKey: string; time: string | null }>>(new Map());
  // Drag-to-create state
  const [dragCreate, setDragCreate] = useState<{
    dateKey: string;
    startY: number;
    currentY: number;
    startTime: string;
    endTime: string;
    durationMinutes: number;
  } | null>(null);
  const [isDragCreating, setIsDragCreating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Initialize internal date (only if not controlled from parent)
  useEffect(() => {
    if (!externalDate) {
      setInternalDate(new Date());
    }
  }, [externalDate]);

  // Scroll to 8am on mount
  useEffect(() => {
    if (scrollRef.current && currentDate) {
      const scrollTo = 8 * HOUR_HEIGHT; // 8am position
      scrollRef.current.scrollTop = scrollTo;
    }
  }, [currentDate]);

  // Clear optimistic moves when tasks prop changes (server sync)
  useEffect(() => {
    setOptimisticMoves(new Map());
  }, [tasks]);

  // Escape key handler for drag-to-create
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (dragCreate || isDragCreating)) {
        setDragCreate(null);
        setIsDragCreating(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragCreate, isDragCreating]);

  const weekStart = currentDate
    ? startOfWeek(currentDate, { weekStartsOn: 0 })
    : new Date();
  const weekEnd = currentDate
    ? endOfWeek(currentDate, { weekStartsOn: 0 })
    : new Date();
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Group tasks by date and time, applying optimistic overrides
  const tasksByDate = useMemo(() => {
    const map = new Map<string, { timed: Task[]; allDay: Task[] }>();

    weekDays.forEach((day) => {
      map.set(format(day, "yyyy-MM-dd"), { timed: [], allDay: [] });
    });

    tasks.forEach((task) => {
      // Check for optimistic move override
      const optimistic = optimisticMoves.get(task.id);
      const effectiveDateKey = optimistic?.dateKey || (task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : null);
      const effectiveTime = optimistic ? optimistic.time : task.dueTime;

      if (!effectiveDateKey) return;
      const entry = map.get(effectiveDateKey);
      if (!entry) return;

      // Create task with effective values if optimistic
      const effectiveTask = optimistic
        ? { ...task, dueTime: effectiveTime }
        : task;

      if (effectiveTime) {
        entry.timed.push(effectiveTask);
      } else {
        entry.allDay.push(effectiveTask);
      }
    });

    return map;
  }, [tasks, weekDays, optimisticMoves]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, { timed: CalendarEvent[]; allDay: CalendarEvent[] }>();

    weekDays.forEach((day) => {
      map.set(format(day, "yyyy-MM-dd"), { timed: [], allDay: [] });
    });

    events.forEach((event) => {
      const dateKey = event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd") : null;
      if (!dateKey) return;
      const entry = map.get(dateKey);
      if (!entry) return;

      if (event.isAllDay || !event.startTime) {
        entry.allDay.push(event);
      } else {
        entry.timed.push(event);
      }
    });

    return map;
  }, [events, weekDays]);

  // Check if any day has all-day tasks or events
  const hasAllDayItems = useMemo(() => {
    for (const [, data] of tasksByDate) {
      if (data.allDay.length > 0) return true;
    }
    for (const [, data] of eventsByDate) {
      if (data.allDay.length > 0) return true;
    }
    return false;
  }, [tasksByDate, eventsByDate]);

  // Get max number of all-day items for any day
  const maxAllDayItems = useMemo(() => {
    let max = 0;
    for (const [dateKey, data] of tasksByDate) {
      const eventData = eventsByDate.get(dateKey);
      const total = data.allDay.length + (eventData?.allDay.length || 0);
      max = Math.max(max, total);
    }
    return max;
  }, [tasksByDate, eventsByDate]);

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeId) || null,
    [activeId, tasks]
  );

  // For events, activeId is prefixed with "event-"
  const activeEvent = useMemo(
    () => {
      if (!activeId?.startsWith("event-")) return null;
      const eventId = activeId.replace("event-", "");
      return events.find((e) => e.id === eventId) || null;
    },
    [activeId, events]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setDragTarget(null);

    // Calculate where within the task the user clicked for accurate positioning
    const activeRect = event.active.rect.current.initial;
    const pointerY = (event.activatorEvent as PointerEvent)?.clientY || 0;
    if (activeRect) {
      setDragClickOffset(pointerY - activeRect.top);
    }
  }, []);

  // Track which slot is being hovered for preview
  const handleDragMove = useCallback((event: DragMoveEvent) => {
    const { over } = event;

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

    // Use the translated rect which tracks the dragged element's current position
    const activeRect = event.active.rect.current.translated;
    if (!activeRect) {
      setDragTarget(null);
      return;
    }

    const gridRect = gridRef.current.getBoundingClientRect();

    // Calculate pointer Y: task's current top + where user clicked within the task
    const pointerY = activeRect.top + dragClickOffset;
    // Convert to grid-relative position (gridRect.top already accounts for scroll)
    const currentY = pointerY - gridRect.top;

    const { time, displayTime } = pixelToTime(currentY);
    setDragTarget({ dateKey, time, displayTime });
  }, [dragClickOffset]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      const activeIdStr = active.id as string;
      const isEvent = activeIdStr.startsWith("event-");

      if (!over || (!onTaskMove && !isEvent) || (!onEventMove && isEvent)) {
        setActiveId(null);
        setDragTarget(null);
        return;
      }

      const overId = over.id as string;

      // Parse the drop target: "YYYY-MM-DD-HH" or "YYYY-MM-DD-allday"
      const parts = overId.split("-");
      if (parts.length < 4) {
        setActiveId(null);
        setDragTarget(null);
        return;
      }

      const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const hourOrAllDay = parts[3];

      const newDate = new Date(dateKey + "T12:00:00");

      // Determine the new time
      let newTime: string | null;
      if (hourOrAllDay === "allday") {
        newTime = null; // Dropped on all-day section - clear time
      } else {
        // Use the precise time from drag target if available
        newTime = dragTarget?.time || `${parseInt(hourOrAllDay, 10).toString().padStart(2, "0")}:00`;
      }

      if (isEvent) {
        // Handle event move
        const eventId = activeIdStr.replace("event-", "");
        const originalEvent = events.find(e => e.id === eventId);

        console.log('🔵 Event drag ended:', {
          eventId,
          dateKey,
          newTime,
          dragTarget,
          originalEvent: {
            id: originalEvent?.id,
            startDate: originalEvent?.startDate,
            startTime: originalEvent?.startTime,
            endTime: originalEvent?.endTime,
          }
        });

        setActiveId(null);
        setDragTarget(null);
        onEventMove?.(eventId, newDate, newTime || undefined);
      } else {
        // Handle task move
        const taskId = activeIdStr;

        // Set optimistic move FIRST (before clearing activeId) to prevent flash
        setOptimisticMoves((prev) => {
          const next = new Map(prev);
          next.set(taskId, { dateKey, time: newTime });
          return next;
        });

        // NOW clear drag state - task will render at optimistic position immediately
        setActiveId(null);
        setDragTarget(null);

        // Trigger the actual update
        onTaskMove?.(taskId, newDate, newTime || "");
      }
    },
    [onTaskMove, onEventMove, dragTarget, events]
  );

  const handleResizePreview = useCallback((taskId: string, duration: number | null) => {
    if (duration === null) {
      setResizePreview(null);
    } else {
      setResizePreview({ taskId, duration });
    }
  }, []);

  // Drag-to-create handlers
  const DRAG_CREATE_THRESHOLD = 5;

  const handleDragCreateStart = useCallback((e: React.PointerEvent, dateKey: string) => {
    // Don't start if DnD is active
    if (activeId) return;
    // Don't start if clicking on a task or event
    const target = e.target as HTMLElement;
    if (target.closest('[data-task-id]') || target.closest('[data-event-id]')) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    // getBoundingClientRect already accounts for scroll position
    const relativeY = e.clientY - gridRect.top;
    const { time } = pixelToTime(relativeY);

    setDragCreate({
      dateKey,
      startY: relativeY,
      currentY: relativeY,
      startTime: time,
      endTime: time,
      durationMinutes: 15,
    });
  }, [activeId]);

  const handleDragCreateMove = useCallback((e: React.PointerEvent) => {
    if (!dragCreate) return;

    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) return;

    // getBoundingClientRect already accounts for scroll position
    const relativeY = e.clientY - gridRect.top;
    const dragDistance = Math.abs(relativeY - dragCreate.startY);

    if (dragDistance < DRAG_CREATE_THRESHOLD && !isDragCreating) return;
    if (!isDragCreating) setIsDragCreating(true);

    // Handle reverse drag (up)
    const startY = Math.min(dragCreate.startY, relativeY);
    const endY = Math.max(dragCreate.startY, relativeY);

    const { time: startTime } = pixelToTime(startY);
    const { time: endTime } = pixelToTime(endY);

    const startMins = parseTimeToMinutes(startTime) || 0;
    const endMins = parseTimeToMinutes(endTime) || 0;
    const duration = Math.max(15, endMins - startMins);

    setDragCreate({ ...dragCreate, currentY: relativeY, startTime, endTime, durationMinutes: duration });
  }, [dragCreate, isDragCreating]);

  const handleDragCreateEnd = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);

    if (dragCreate && isDragCreating && dragCreate.durationMinutes >= 15) {
      onDragCreate?.({
        dateKey: dragCreate.dateKey,
        startTime: dragCreate.startTime,
        endTime: dragCreate.endTime,
        duration: dragCreate.durationMinutes,
      });
    }

    setDragCreate(null);
    setIsDragCreating(false);
  }, [dragCreate, isDragCreating, onDragCreate]);

  const handleDragCreateCancel = useCallback((e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    setDragCreate(null);
    setIsDragCreating(false);
  }, []);

  const navigate = (direction: "prev" | "next") => {
    if (!currentDate) return;
    const newDate = direction === "prev"
      ? subWeeks(currentDate, 1)
      : addWeeks(currentDate, 1);
    updateCurrentDate(newDate);
  };

  if (!currentDate) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] h-full animate-pulse" />
    );
  }

  // Calculate all-day section height based on content
  const allDayHeight = hasAllDayItems
    ? Math.min(Math.max(maxAllDayItems * 24 + 8, 40), 120) // min 40px, max 120px
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
              onClick={() => updateCurrentDate(new Date())}
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
          <div className="w-16 shrink-0 border-r border-[var(--border-subtle)]" />
          
          {/* Day headers */}
          {weekDays.map((day) => {
            const isCurrentDay = isToday(day);
            const dateKey = format(day, "yyyy-MM-dd");
            
            return (
              <div
                key={dateKey}
                className={cn(
                  "flex-1 min-w-0 px-2 py-2 text-center border-r border-[var(--border-subtle)] last:border-r-0",
                  isCurrentDay && "bg-[var(--bg-surface)]"
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
        {hasAllDayItems && (
          <div className="flex border-b border-[var(--border-subtle)] shrink-0 bg-[var(--bg-base)]">
            {/* Label */}
            <div className="w-16 shrink-0 border-r border-[var(--border-subtle)] px-1 py-1 text-[10px] text-[var(--text-quaternary)]">
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
                const eventData = eventsByDate.get(dateKey);
                return (
                  <AllDayCell
                    key={dateKey}
                    dateKey={dateKey}
                    tasks={dayData?.allDay || []}
                    events={eventData?.allDay || []}
                    onTaskClick={onTaskClick}
                    onEventClick={onEventClick}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Scrollable time grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          <div ref={gridRef} className="flex min-w-0 min-h-full relative">
            {/* Time labels */}
            <div className="w-16 shrink-0 border-r border-[var(--border-subtle)] min-h-full">
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
              const eventData = eventsByDate.get(dateKey);
              const timedTasks = dayData?.timed || [];
              const timedEvents = eventData?.timed || [];
              const isCurrentDay = isToday(day);

              // Calculate layouts for overlapping tasks
              const taskLayouts = calculateTaskLayouts(timedTasks);
              const layoutMap = new Map(taskLayouts.map(l => [l.task.id, l]));

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "flex-1 min-w-0 min-h-full border-r border-[var(--border-subtle)] last:border-r-0 relative",
                    isCurrentDay && "bg-[var(--bg-surface)]/30",
                    !activeId && "cursor-crosshair"
                  )}
                  onPointerDown={(e) => handleDragCreateStart(e, dateKey)}
                  onPointerMove={handleDragCreateMove}
                  onPointerUp={handleDragCreateEnd}
                  onPointerCancel={handleDragCreateCancel}
                >
                  {/* Hour slots (for drop targets) */}
                  {HOURS.map((hour) => (
                    <HourSlot
                      key={hour}
                      dateKey={dateKey}
                      hour={hour}
                    />
                  ))}

                  {/* Current time indicator - thick solid line for today only */}
                  {isCurrentDay && <CurrentTimeIndicatorLine />}

                  {/* Drop preview overlay - dashed outline showing where item will land */}
                  {dragTarget && dragTarget.dateKey === dateKey && dragTarget.time && (activeTask || activeEvent) && (
                    <DropPreview
                      time={dragTarget.time}
                      duration={activeTask?.duration || (activeEvent ? calculateEventDuration(activeEvent.startTime, activeEvent.endTime) : 30)}
                    />
                  )}

                  {/* Create selection preview - shows during drag-to-create */}
                  {dragCreate?.dateKey === dateKey && isDragCreating && (
                    <CreateSelectionPreview
                      startTime={dragCreate.startTime}
                      endTime={dragCreate.endTime}
                      durationMinutes={dragCreate.durationMinutes}
                    />
                  )}

                  {/* Positioned timed events */}
                  {timedEvents.map((event) => {
                    const top = getTopPosition(event.startTime);
                    // Don't render the event being dragged
                    if (`event-${event.id}` === activeId) return null;

                    return (
                      <TimedEvent
                        key={event.id}
                        event={event}
                        onClick={() => onEventClick?.(event)}
                        onResize={onEventResize}
                        onResizePreview={handleResizePreview}
                        style={{
                          top: `${top}px`,
                        }}
                      />
                    );
                  })}

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

            {/* Current time indicator - thin faded line spans full width */}
            {weekDays.some(day => isToday(day)) && <CurrentTimeIndicatorBackground />}
          </div>
        </div>
      </div>

      {/* Drag overlay - follows cursor, matches card size */}
      <DragOverlay>
        {activeTask ? (
          <div
            className={cn(
              "px-1.5 py-1 rounded text-xs cursor-grabbing overflow-hidden",
              "bg-[var(--bg-surface)] border border-[var(--accent-primary)]/50 shadow-xl",
              activeTask.status === "done" && "opacity-50",
              activeTask.priority === "non-negotiable" && "border-l-2 border-l-red-500"
            )}
            style={{
              width: "140px",
              height: `${getHeightFromDuration(activeTask.duration || 30)}px`,
              minHeight: "28px",
            }}
          >
            <div className="font-medium truncate text-[var(--text-primary)] text-[11px]">
              {activeTask.name}
            </div>
            {activeTask.dueTime && (
              <div className="text-[10px] text-[var(--text-tertiary)]">
                {dragTarget ? (
                  <span className="text-[var(--accent-primary)]">{dragTarget.displayTime}</span>
                ) : (
                  formatTime12h(activeTask.dueTime)
                )}
              </div>
            )}
          </div>
        ) : activeEvent ? (
          <div
            className="px-1.5 py-1 rounded text-xs cursor-grabbing overflow-hidden border-l-2 shadow-xl"
            style={{
              width: "140px",
              height: `${getHeightFromDuration(calculateEventDuration(activeEvent.startTime, activeEvent.endTime))}px`,
              minHeight: "28px",
              backgroundColor: `${activeEvent.color}30`,
              borderColor: activeEvent.color,
            }}
          >
            <div className="font-medium truncate text-[11px]" style={{ color: activeEvent.color }}>
              {activeEvent.name}
            </div>
            {activeEvent.startTime && (
              <div className="text-[10px] opacity-70" style={{ color: activeEvent.color }}>
                {dragTarget ? (
                  <span>{dragTarget.displayTime}</span>
                ) : (
                  formatTime12h(activeEvent.startTime)
                )}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
