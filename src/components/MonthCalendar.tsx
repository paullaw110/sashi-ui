"use client";

import { useState, useMemo, useCallback, useEffect, useRef, memo } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
} from "@dnd-kit/core";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addMonths,
  subMonths,
  isSameMonth,
} from "date-fns";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
  dueTime: string | null;
  tags: string | null;
  description?: string | null;
};

interface MonthCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newDate: Date) => void;
  onTasksMove?: (taskIds: string[], newDate: Date) => void;
}

// Get status indicator icon
function getStatusIndicator(status: string) {
  switch (status) {
    case "done":
      return "✓";
    case "in_progress":
      return "●";
    case "waiting":
      return "⏸";
    default:
      return "○";
  }
}

// Get status color
function getStatusColor(status: string) {
  switch (status) {
    case "done":
      return "text-green-400";
    case "in_progress":
      return "text-blue-400";
    case "waiting":
      return "text-amber-400";
    default:
      return "text-[#404040]";
  }
}

// Enhanced draggable task component with status indicators
const TaskItem = memo(function TaskItem({
  task,
  onClick,
}: {
  task: Task;
  onClick?: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: task.id,
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
        "text-[10px] px-1.5 py-1 mb-1 rounded bg-[#1a1a1a] hover:bg-[#222] cursor-grab active:cursor-grabbing text-[#a3a3a3] transition-colors border border-transparent hover:border-[#333] touch-none",
        task.status === "done" && "line-through text-[#525252]",
        task.priority === "critical" && "border-l-2 border-l-red-500/50",
        task.priority === "high" && "border-l-2 border-l-amber-500/50",
        task.priority === "medium" && "border-l-2 border-l-blue-500/50",
        isDragging && "opacity-30"
      )}
    >
      <div className="flex items-center gap-1">
        <span className={cn("text-[8px] font-mono", getStatusColor(task.status))}>
          {getStatusIndicator(task.status)}
        </span>
        <span className="truncate flex-1">{task.name}</span>
        {task.dueTime && (
          <span className="text-[8px] text-[#525252]">
            {task.dueTime.substring(0, 5)}
          </span>
        )}
      </div>
    </div>
  );
});

// Droppable day cell - auto-expands to fit all tasks
const DayCell = memo(function DayCell({
  day,
  tasks,
  isCurrentDay,
  isInCurrentMonth,
  onTaskClick,
  todayRef,
}: {
  day: Date;
  tasks: Task[];
  isCurrentDay: boolean;
  isInCurrentMonth: boolean;
  onTaskClick?: (task: Task) => void;
  todayRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
  });

  const dayNumber = format(day, "d");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-r border-b border-[#161616] last:border-r-0 min-h-[80px] flex flex-col relative",
        isOver && "bg-blue-500/10",
        !isInCurrentMonth && "bg-[#0a0a0a]"
      )}
    >
      {/* Anchor for scrolling to today */}
      {isCurrentDay && todayRef && (
        <div ref={todayRef} className="absolute top-0 left-0" />
      )}

      {/* Day Number */}
      <div className={cn(
        "px-2 py-1.5 text-xs font-medium border-b border-[#161616]",
        isCurrentDay
          ? "bg-blue-500/20 text-blue-400"
          : isInCurrentMonth
          ? "text-[#f5f5f5]"
          : "text-[#404040]"
      )}>
        {dayNumber}
      </div>

      {/* Tasks Area - no overflow hidden, shows ALL tasks */}
      <div className="flex-1 p-1 space-y-0.5">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length === 0 && isOver && (
          <div className="h-full flex items-center justify-center opacity-50">
            <Plus size={12} className="text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
});

// Single month component
const SingleMonth = memo(function SingleMonth({
  month,
  tasksByDate,
  onTaskClick,
  todayRef,
}: {
  month: Date;
  tasksByDate: Map<string, Task[]>;
  onTaskClick?: (task: Task) => void;
  todayRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <div className="mb-0">
      {/* Month Label */}
      <div className="px-4 py-2 bg-[#0d0d0d] border-b border-[#1a1a1a]">
        <h3 className="font-display text-sm text-[#f5f5f5]">
          {format(month, "MMMM yyyy")}
        </h3>
      </div>

      {/* Calendar Grid for this month */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDate.get(dateKey) || [];
          const isCurrentDay = isToday(day);
          const isInCurrentMonth = isSameMonth(day, month);

          return (
            <DayCell
              key={dateKey}
              day={day}
              tasks={dayTasks}
              isCurrentDay={isCurrentDay}
              isInCurrentMonth={isInCurrentMonth}
              onTaskClick={onTaskClick}
              todayRef={isCurrentDay ? todayRef : undefined}
            />
          );
        })}
      </div>
    </div>
  );
});

export function MonthCalendar({
  tasks,
  onTaskClick,
  onTaskMove,
}: MonthCalendarProps) {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, string>>(new Map());

  // Range of months to display
  const [monthsRange, setMonthsRange] = useState<{
    startMonth: Date;
    endMonth: Date;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const topSentinelRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  // Initialize on client only
  useEffect(() => {
    const now = new Date();
    setMonthsRange({
      startMonth: subMonths(startOfMonth(now), 1),
      endMonth: addMonths(startOfMonth(now), 2),
    });
    setMounted(true);
  }, []);

  // Scroll to today on initial mount
  useEffect(() => {
    if (mounted && todayRef.current) {
      const timer = setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: 'instant',
          block: 'start',
        });
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [mounted]);

  // Clear optimistic moves when tasks prop changes
  useEffect(() => {
    setOptimisticMoves(new Map());
  }, [tasks]);

  // Generate list of months to render
  const monthsToRender = useMemo(() => {
    if (!monthsRange) return [];
    const months: Date[] = [];
    let current = monthsRange.startMonth;
    while (current <= monthsRange.endMonth) {
      months.push(current);
      current = addMonths(current, 1);
    }
    return months;
  }, [monthsRange]);

  // Group tasks by date with optimistic overrides
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        const optimisticDate = optimisticMoves.get(task.id);
        const dateKey = optimisticDate || format(new Date(task.dueDate), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, task]);
      }
    });
    return map;
  }, [tasks, optimisticMoves]);

  const activeTask = useMemo(() => {
    if (!activeId) return null;
    return tasks.find(t => t.id === activeId) || null;
  }, [activeId, tasks]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || !onTaskMove) return;

    const taskId = active.id as string;
    const targetDateKey = over.id as string;

    if (/^\d{4}-\d{2}-\d{2}$/.test(targetDateKey)) {
      setOptimisticMoves(prev => new Map(prev).set(taskId, targetDateKey));
      const newDate = new Date(targetDateKey + "T12:00:00");
      onTaskMove(taskId, newDate);
    }
  }, [onTaskMove]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Infinite scroll - load more months when approaching edges
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const options: IntersectionObserverInit = {
      root: containerRef.current,
      rootMargin: '200px',
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === topSentinelRef.current) {
            setMonthsRange(prev => prev ? {
              ...prev,
              startMonth: subMonths(prev.startMonth, 2),
            } : prev);
          } else if (entry.target === bottomSentinelRef.current) {
            setMonthsRange(prev => prev ? {
              ...prev,
              endMonth: addMonths(prev.endMonth, 2),
            } : prev);
          }
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, options);

    if (topSentinelRef.current) observer.observe(topSentinelRef.current);
    if (bottomSentinelRef.current) observer.observe(bottomSentinelRef.current);

    return () => observer.disconnect();
  }, [mounted]);

  // Scroll to today
  const scrollToToday = useCallback(() => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    } else {
      // Reset range to include today if not visible
      const now = new Date();
      setMonthsRange({
        startMonth: subMonths(startOfMonth(now), 1),
        endMonth: addMonths(startOfMonth(now), 2),
      });
      setTimeout(() => {
        todayRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100);
    }
  }, []);

  // Don't render until client-side
  if (!mounted || !monthsRange) {
    return (
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a] h-[600px] animate-pulse" />
    );
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a] flex flex-col h-[calc(100vh-200px)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
          <h2 className="font-display text-base text-[#f5f5f5]">
            Calendar
          </h2>
          <button
            onClick={scrollToToday}
            className="text-[10px] text-[#e5e5e5] bg-[#1a1a1a] hover:bg-[#222] px-3 py-1.5 rounded transition-colors"
          >
            Today
          </button>
        </div>

        {/* Sticky Week Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#1a1a1a] shrink-0 bg-[#111]">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-[10px] text-[#525252] font-medium uppercase tracking-wider border-r border-[#161616] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Scrollable Months Container */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden"
        >
          {/* Top Sentinel for loading previous months */}
          <div ref={topSentinelRef} className="h-px" />

          {/* Render all months */}
          {monthsToRender.map((month) => (
            <SingleMonth
              key={format(month, 'yyyy-MM')}
              month={month}
              tasksByDate={tasksByDate}
              onTaskClick={onTaskClick}
              todayRef={isSameMonth(month, new Date()) ? todayRef : undefined}
            />
          ))}

          {/* Bottom Sentinel for loading next months */}
          <div ref={bottomSentinelRef} className="h-px" />
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeTask ? (
          <div className="px-2 py-1.5 rounded bg-[#222] shadow-xl border border-[#444] text-[11px] text-[#f5f5f5] cursor-grabbing transform rotate-2 scale-105">
            <div className="flex items-center gap-1.5">
              <span className={cn("text-[10px] font-mono", getStatusColor(activeTask.status))}>
                {getStatusIndicator(activeTask.status)}
              </span>
              <span>{activeTask.name}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
