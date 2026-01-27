"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
  rectIntersection,
} from "@dnd-kit/core";
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  addWeeks,
  subWeeks,
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

interface WeekCalendarProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onTaskMove?: (taskId: string, newDate: Date) => void;
  onTasksMove?: (taskIds: string[], newDate: Date) => void;
}

// Draggable task component
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
        "text-[11px] px-2 py-1.5 rounded bg-[#1a1a1a] hover:bg-[#222] cursor-grab active:cursor-grabbing text-[#a3a3a3] truncate transition-colors border border-transparent hover:border-[#333] touch-none",
        task.status === "done" && "line-through text-[#525252]",
        task.priority === "critical" && "border-l-2 border-l-red-500/50",
        task.priority === "high" && "border-l-2 border-l-amber-500/50",
        isDragging && "opacity-50 z-50"
      )}
    >
      {task.name}
    </div>
  );
}

// Droppable day column
function DayColumn({
  day,
  tasks,
  isCurrentDay,
  onTaskClick,
}: {
  day: Date;
  tasks: Task[];
  isCurrentDay: boolean;
  onTaskClick?: (task: Task) => void;
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
  });

  return (
    <div className="border-r border-[#161616] last:border-r-0 min-h-[180px] flex flex-col">
      {/* Day Header */}
      <div className={cn(
        "px-2 py-3 text-center border-b border-[#161616]",
        isCurrentDay && "bg-[#1a1a1a]"
      )}>
        <div className="text-[9px] text-[#404040] uppercase tracking-widest">
          {format(day, "EEE")}
        </div>
        <div className={cn(
          "text-lg mt-0.5 font-display",
          isCurrentDay 
            ? "text-[#f5f5f5] font-medium" 
            : "text-[#737373]"
        )}>
          {format(day, "d")}
        </div>
      </div>

      {/* Droppable Tasks Area */}
      <div 
        ref={setNodeRef}
        className={cn(
          "flex-1 p-1.5 space-y-1 min-h-[100px]",
          isOver && "bg-blue-500/10"
        )}
      >
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onClick={() => onTaskClick?.(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Plus size={14} className="text-[#333]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function WeekCalendar({
  tasks,
  onTaskClick,
  onTaskMove,
}: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  // Optimistic updates: track moved tasks locally until server syncs
  const [optimisticMoves, setOptimisticMoves] = useState<Map<string, string>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
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
      <div className="bg-[#111] rounded-lg border border-[#1a1a1a] h-[300px] animate-pulse" />
    );
  }

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const navigate = (direction: "prev" | "next") => {
    setCurrentDate(direction === "prev" ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
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

        {/* Calendar Grid */}
        <div className="grid grid-cols-7">
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayTasks = tasksByDate.get(dateKey) || [];
            const isCurrentDay = isToday(day);

            return (
              <DayColumn
                key={dateKey}
                day={day}
                tasks={dayTasks}
                isCurrentDay={isCurrentDay}
                onTaskClick={onTaskClick}
              />
            );
          })}
        </div>
      </div>

      {/* Drag Overlay - follows cursor */}
      <DragOverlay>
        {activeTask ? (
          <div className="px-2 py-1.5 rounded bg-[#222] shadow-xl border border-[#444] text-[11px] text-[#f5f5f5] cursor-grabbing">
            {activeTask.name}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
