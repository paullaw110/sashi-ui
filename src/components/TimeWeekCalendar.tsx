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
  setMinutes,
  getHours,
  getMinutes,
  isSameDay,
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
  tags: string | null;
  description?: string | null;
};

interface TimeWeekCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newDate: Date, newTime?: string) => void;
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

// Format minutes to time string
function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

// Calculate top position for a time
function getTopPosition(time: string | null): number {
  const minutes = parseTimeToMinutes(time);
  if (minutes === null) return 0;
  const startMinutes = 6 * 60; // 6am
  return ((minutes - startMinutes) / 60) * HOUR_HEIGHT;
}

// Draggable task component
function TaskItem({
  task,
  onClick,
  style,
}: {
  task: Task;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  });

  const hasTime = !!task.dueTime;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      style={style}
      className={cn(
        "absolute left-1 right-1 px-2 py-1 rounded text-xs cursor-grab active:cursor-grabbing touch-none transition-colors",
        "bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)]",
        task.status === "done" && "opacity-50 line-through",
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500",
        isDragging && "opacity-30 z-50"
      )}
    >
      <div className="font-medium truncate text-[var(--text-primary)]">
        {task.name}
      </div>
      {hasTime && (
        <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">
          {task.dueTime?.substring(0, 5)}
        </div>
      )}
    </div>
  );
}

// All-day / no-time tasks section
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
        "px-2 py-1 mb-1 rounded text-xs cursor-grab active:cursor-grabbing touch-none",
        "bg-[var(--bg-surface)] border border-[var(--border-default)] hover:border-[var(--border-strong)]",
        task.status === "done" && "opacity-50 line-through",
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500",
        isDragging && "opacity-30"
      )}
    >
      <span className="truncate text-[var(--text-primary)]">{task.name}</span>
    </div>
  );
}

// Droppable hour slot
function HourSlot({
  dateKey,
  hour,
  children,
}: {
  dateKey: string;
  hour: number;
  children?: React.ReactNode;
}) {
  const slotId = `${dateKey}-${hour}`;
  const { setNodeRef, isOver } = useDroppable({ id: slotId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-t border-[var(--border-subtle)] relative",
        isOver && "bg-blue-500/10"
      )}
      style={{ height: HOUR_HEIGHT }}
    >
      {children}
    </div>
  );
}

// Day column with hour slots
function DayColumn({
  day,
  timedTasks,
  allDayTasks,
  isCurrentDay,
  onTaskClick,
}: {
  day: Date;
  timedTasks: Task[];
  allDayTasks: Task[];
  isCurrentDay: boolean;
  onTaskClick?: (task: Task) => void;
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  const { setNodeRef: setAllDayRef, isOver: isOverAllDay } = useDroppable({
    id: `${dateKey}-allday`,
  });

  return (
    <div className="flex-1 min-w-0 border-r border-[var(--border-subtle)] last:border-r-0">
      {/* Day header */}
      <div
        className={cn(
          "sticky top-0 z-10 px-2 py-2 text-center border-b border-[var(--border-subtle)] bg-[var(--bg-elevated)]",
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

      {/* All-day section */}
      <div
        ref={setAllDayRef}
        className={cn(
          "min-h-[40px] px-1 py-1 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]",
          isOverAllDay && "bg-blue-500/10"
        )}
      >
        {allDayTasks.map((task) => (
          <AllDayTask
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
      </div>

      {/* Hour slots */}
      <div className="relative">
        {HOURS.map((hour) => (
          <HourSlot key={hour} dateKey={dateKey} hour={hour} />
        ))}

        {/* Positioned timed tasks */}
        {timedTasks.map((task) => {
          const top = getTopPosition(task.dueTime);
          return (
            <TaskItem
              key={task.id}
              task={task}
              onClick={() => onTaskClick?.(task)}
              style={{
                top: `${top}px`,
                minHeight: "28px",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

export function TimeWeekCalendar({
  tasks,
  onTaskClick,
  onTaskMove,
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
    if (scrollRef.current) {
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
    const map = new Map<
      string,
      { timed: Task[]; allDay: Task[] }
    >();

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

      // Parse the drop target
      // Format: "YYYY-MM-DD-HH" or "YYYY-MM-DD-allday"
      const parts = overId.split("-");
      if (parts.length < 4) return;

      const dateKey = `${parts[0]}-${parts[1]}-${parts[2]}`;
      const hourOrAllDay = parts[3];

      const newDate = new Date(dateKey + "T12:00:00");

      if (hourOrAllDay === "allday") {
        onTaskMove(taskId, newDate, undefined);
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
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] h-[600px] animate-pulse" />
    );
  }

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

        {/* Scrollable grid */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0">
          <div className="flex min-w-0">
            {/* Time labels */}
            <div className="w-12 shrink-0 border-r border-[var(--border-subtle)]">
              {/* Header spacer */}
              <div className="h-[52px] border-b border-[var(--border-subtle)]" />
              {/* All-day spacer */}
              <div className="h-[40px] border-b border-[var(--border-subtle)]" />
              {/* Hour labels */}
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
              const dayData = tasksByDate.get(dateKey) || {
                timed: [],
                allDay: [],
              };

              return (
                <DayColumn
                  key={dateKey}
                  day={day}
                  timedTasks={dayData.timed}
                  allDayTasks={dayData.allDay}
                  isCurrentDay={isToday(day)}
                  onTaskClick={onTaskClick}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="px-3 py-2 rounded bg-[var(--bg-active)] shadow-xl border border-[var(--border-strong)] text-sm text-[var(--text-primary)] cursor-grabbing font-medium">
            {activeTask.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
