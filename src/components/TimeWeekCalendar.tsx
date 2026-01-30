"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
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

// Draggable timed task with resize (positioned absolutely in hour grid)
function TimedTask({
  task,
  onClick,
  onResize,
  style,
}: {
  task: Task;
  onClick?: () => void;
  onResize?: (taskId: string, newDuration: number) => void;
  style?: React.CSSProperties;
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [initialDuration, setInitialDuration] = useState(task.duration || 30);
  const justResizedRef = useRef(false);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
    disabled: isResizing,
  });

  const height = getHeightFromDuration(task.duration);

  const handleResizeStart = (e: React.MouseEvent | React.PointerEvent) => {
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
      const deltaY = e.clientY - resizeStartY;
      // Convert pixels to minutes (HOUR_HEIGHT px = 60 min)
      const deltaMinutes = (deltaY / HOUR_HEIGHT) * 60;
      // Snap to 15 min increments, min 15 min
      const newDuration = Math.max(15, Math.round((initialDuration + deltaMinutes) / 15) * 15);
      
      if (onResize && newDuration !== task.duration) {
        onResize(task.id, newDuration);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
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
      style={{ ...style, height: `${height}px`, minHeight: "28px" }}
      className={cn(
        "absolute left-0.5 right-0.5 px-1.5 py-1 rounded text-xs cursor-grab active:cursor-grabbing touch-none overflow-hidden group",
        "bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)]",
        task.status === "done" && "opacity-50",
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500",
        task.priority === "critical" && "border-l-2 border-l-red-500",
        task.priority === "high" && "border-l-2 border-l-amber-500",
        isDragging && "opacity-30 z-50",
        isResizing && "z-50 ring-2 ring-blue-500/50"
      )}
    >
      <div className="font-medium truncate text-[var(--text-primary)] text-[11px]">
        {task.name}
      </div>
      {task.dueTime && (
        <div className="text-[10px] text-[var(--text-tertiary)]">
          {task.dueTime.substring(0, 5)}
        </div>
      )}
      
      {/* Resize handle */}
      {onResize && (
        <div 
          onMouseDown={handleResizeStart}
          onPointerDown={(e) => {
            e.stopPropagation();
            handleResizeStart(e);
          }}
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-0 left-0 right-0 h-3 cursor-ns-resize bg-transparent hover:bg-blue-500/10 transition-all z-20 touch-none group/resize"
        >
          {/* Resize indicator bar */}
          <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-[var(--border-default)] opacity-0 group-hover:opacity-100 group-hover/resize:bg-blue-400 transition-opacity" />
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
        "border-t border-[var(--border-subtle)]",
        isOver && "bg-blue-500/10"
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
        "flex-1 min-w-0 border-r border-[var(--border-subtle)] last:border-r-0 px-0.5 py-0.5",
        isOver && "bg-blue-500/10"
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

export function TimeWeekCalendar({
  tasks,
  onTaskClick,
  onTaskMove,
  onTaskResize,
}: TimeWeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

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
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over || !onTaskMove) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      // Parse the drop target: "YYYY-MM-DD-HH" or "YYYY-MM-DD-allday"
      const parts = overId.split("-");
      if (parts.length < 4) return;

      const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const hourOrAllDay = parts[3];

      const newDate = new Date(dateKey + "T12:00:00");

      if (hourOrAllDay === "allday") {
        // Dropped on all-day section - clear time
        onTaskMove(taskId, newDate, "");
      } else {
        const hour = parseInt(hourOrAllDay, 10);
        const newTime = `${hour.toString().padStart(2, "0")}:00`;
        onTaskMove(taskId, newDate, newTime);
      }
    },
    [onTaskMove]
  );

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
            return (
              <div
                key={format(day, "yyyy-MM-dd")}
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
          <div className="flex min-w-0">
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
                    <HourSlot key={hour} dateKey={dateKey} hour={hour} />
                  ))}

                  {/* Positioned timed tasks */}
                  {timedTasks.map((task) => {
                    const top = getTopPosition(task.dueTime);
                    return (
                      <TimedTask
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick?.(task)}
                        onResize={onTaskResize}
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

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="px-3 py-2 rounded bg-[var(--bg-active)] shadow-xl border border-[var(--border-strong)] text-xs text-[var(--text-primary)] cursor-grabbing font-medium max-w-[150px] truncate">
            {activeTask.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
