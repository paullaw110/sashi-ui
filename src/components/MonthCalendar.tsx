"use client";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
  isSameDay,
} from "date-fns";

type Task = {
  id: string;
  name: string;
  projectId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;  // ISO string from server
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
function TaskItem({ 
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
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
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
        isDragging && "opacity-50 z-50"
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
}

// Droppable day cell
function DayCell({
  day,
  tasks,
  isCurrentDay,
  isInCurrentMonth,
  onTaskClick,
}: {
  day: Date;
  tasks: Task[];
  isCurrentDay: boolean;
  isInCurrentMonth: boolean;
  onTaskClick?: (task: Task) => void;
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
        "border-r border-b border-[#161616] last:border-r-0 min-h-[120px] flex flex-col relative",
        isOver && "bg-blue-500/10",
        !isInCurrentMonth && "bg-[#0a0a0a]"
      )}
    >
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

      {/* Tasks Area */}
      <div className="flex-1 p-1 space-y-0.5 overflow-hidden">
        {tasks.slice(0, 4).map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length > 4 && (
          <div className="text-[9px] text-[#525252] px-1">
            +{tasks.length - 4} more
          </div>
        )}
        {tasks.length === 0 && isOver && (
          <div className="h-full flex items-center justify-center opacity-50">
            <Plus size={12} className="text-blue-400" />
          </div>
        )}
      </div>
    </div>
  );
}

export function MonthCalendar({
  tasks,
  onTaskClick,
  onTaskMove,
}: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Optimistic updates: track moved tasks locally until server syncs
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, string>>(new Map());

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

  // Clear optimistic moves when tasks prop changes (server synced)
  useEffect(() => {
    setOptimisticMoves(new Map());
  }, [tasks]);

  // Group tasks by date with optimistic overrides
  const tasksByDate = useMemo(() => {
    const map = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (task.dueDate) {
        // Check if there's an optimistic move for this task
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
    
    // Validate it's a date key (YYYY-MM-DD format)
    if (/^\d{4}-\d{2}-\d{2}$/.test(targetDateKey)) {
      // Optimistically update UI immediately
      setOptimisticMoves(prev => new Map(prev).set(taskId, targetDateKey));
      
      const newDate = new Date(targetDateKey + "T12:00:00");
      onTaskMove(taskId, newDate);
    }
  }, [onTaskMove]);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

  // Set date on client only to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Don't render until client-side date is set
  if (!currentDate) {
    return (
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a] h-[600px] animate-pulse" />
    );
  }

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigate = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
  };

  // Week days for header
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
          <h2 className="font-display text-base text-[#f5f5f5]">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("prev")}
              className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
            >
              <ChevronLeft size={14} className="text-[#525252]" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-[10px] text-[#e5e5e5] bg-[#1a1a1a] hover:bg-[#222] px-3 py-1.5 rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => navigate("next")}
              className="p-1 hover:bg-[#1a1a1a] rounded transition-colors"
            >
              <ChevronRight size={14} className="text-[#525252]" />
            </button>
          </div>
        </div>

        {/* Week Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#1a1a1a]">
          {weekDays.map((day) => (
            <div
              key={day}
              className="px-2 py-2 text-center text-[10px] text-[#525252] font-medium uppercase tracking-wider border-r border-[#161616] last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentDay = isToday(day);
            const isInCurrentMonth = isSameMonth(day, currentDate);

            return (
              <DayCell
                key={dateKey}
                day={day}
                tasks={dayTasks}
                isCurrentDay={isCurrentDay}
                isInCurrentMonth={isInCurrentMonth}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - follows cursor */}
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