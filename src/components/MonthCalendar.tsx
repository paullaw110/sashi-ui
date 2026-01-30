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
  organizationId: string | null;
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

// Get readable status label
function getStatusLabel(status: string) {
  switch (status) {
    case "done":
      return "Done";
    case "in_progress":
      return "In Progress";
    case "waiting":
      return "Waiting";
    case "todo":
      return "To Do";
    default:
      return status;
  }
}

// Selection box component for marquee selection
function SelectionBox({
  start,
  end,
  containerRef,
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
      className="absolute pointer-events-none border-2 border-blue-500/50 bg-blue-500/10 z-50 rounded"
      style={{
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    />
  );
}

// Enhanced draggable task component with selection support
const TaskItem = memo(function TaskItem({
  task,
  isSelected,
  isDraggedAlong,
  onSelect,
  onClick,
  registerRef,
}: {
  task: Task;
  isSelected: boolean;
  isDraggedAlong: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onClick?: () => void;
  registerRef?: (taskId: string, element: HTMLElement | null) => void;
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
      ref={(node) => {
        setNodeRef(node);
        registerRef?.(task.id, node);
      }}
      {...listeners}
      {...attributes}
      data-task-item
      onClick={(e) => {
        e.stopPropagation();
        // If shift/cmd/ctrl is held, handle selection
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          onSelect(e);
        } else {
          onClick?.();
        }
      }}
      onMouseDown={(e) => {
        // Handle selection on mousedown for multi-select drag
        if (e.shiftKey || e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onSelect(e);
        }
      }}
      className={cn(
        "text-sm px-2 py-1.5 mb-1.5 rounded bg-[#1a1a1a] hover:bg-[#222] cursor-grab active:cursor-grabbing text-[#e5e5e5] transition-colors border border-transparent hover:border-[#333] touch-none",
        task.status === "done" && "line-through text-[#737373]",
        task.priority === "critical" && "border-l-2 border-l-red-500/50",
        task.priority === "high" && "border-l-2 border-l-amber-500/50",
        task.priority === "medium" && "border-l-2 border-l-blue-500/50",
        !isSelected && !task.priority && "hover:border-[#333]",
        isSelected && "border-blue-500/30 bg-blue-500/10",
        (isDragging || isDraggedAlong) && "opacity-30"
      )}
    >
      <div className="flex items-center gap-1.5 mb-1">
        <span className={cn("text-[10px] font-mono", getStatusColor(task.status))}>
          {getStatusIndicator(task.status)}
        </span>
        <span className="truncate flex-1 font-medium">{task.name}</span>
        {task.dueTime && (
          <span className="text-xs text-[#737373]">
            {task.dueTime.substring(0, 5)}
          </span>
        )}
      </div>
      <div className={cn("text-xs", getStatusColor(task.status))}>
        {getStatusLabel(task.status)}
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
  selectedTasks,
  draggingTaskIds,
  onTaskSelect,
  onTaskClick,
  registerRef,
  todayRef,
  monthContext,
}: {
  day: Date;
  tasks: Task[];
  isCurrentDay: boolean;
  isInCurrentMonth: boolean;
  selectedTasks: Set<string>;
  draggingTaskIds: Set<string>;
  onTaskSelect: (taskId: string, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
  registerRef: (taskId: string, element: HTMLElement | null) => void;
  todayRef?: React.RefObject<HTMLDivElement | null>;
  monthContext?: string;
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  // Make drop zone ID unique by including month context for dates outside current month
  const dropZoneId = isInCurrentMonth ? dateKey : `${monthContext}-${dateKey}`;
  const { setNodeRef, isOver } = useDroppable({
    id: dropZoneId,
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
      <div className="flex-1 p-1.5 space-y-1">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isSelected={selectedTasks.has(task.id)}
            isDraggedAlong={draggingTaskIds.has(task.id)}
            onSelect={(e) => onTaskSelect(task.id, e)}
            onClick={() => onTaskClick?.(task)}
            registerRef={registerRef}
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
  selectedTasks,
  draggingTaskIds,
  onTaskSelect,
  onTaskClick,
  registerRef,
  todayRef,
}: {
  month: Date;
  tasksByDate: Map<string, Task[]>;
  selectedTasks: Set<string>;
  draggingTaskIds: Set<string>;
  onTaskSelect: (taskId: string, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
  registerRef: (taskId: string, element: HTMLElement | null) => void;
  todayRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const monthKey = format(month, 'yyyy-MM');

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
              selectedTasks={selectedTasks}
              draggingTaskIds={draggingTaskIds}
              onTaskSelect={onTaskSelect}
              onTaskClick={onTaskClick}
              registerRef={registerRef}
              todayRef={isCurrentDay ? todayRef : undefined}
              monthContext={monthKey}
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
  onTasksMove,
}: MonthCalendarProps) {
  const [mounted, setMounted] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [draggingTaskIds, setDraggingTaskIds] = useState<Set<string>>(new Set());

  // Marquee selection state
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{ x: number; y: number } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ x: number; y: number } | null>(null);
  const calendarGridRef = useRef<HTMLDivElement>(null);
  const taskElementsRef = useRef<Map<string, HTMLElement>>(new Map());

  // Optimistic updates: track moved tasks locally until server syncs
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
        distance: 5,
      },
    })
  );

  // Clear optimistic moves after a delay to allow server sync
  const optimisticMovesRef = useRef(optimisticMoves);
  optimisticMovesRef.current = optimisticMoves;

  useEffect(() => {
    if (optimisticMovesRef.current.size === 0) return;

    const timer = setTimeout(() => {
      setOptimisticMoves(new Map());
    }, 500);

    return () => clearTimeout(timer);
  }, [tasks]);

  // Clear selection when tasks change (after server sync)
  useEffect(() => {
    setSelectedTasks(new Set());
  }, [tasks]);

  // Register task element for intersection detection
  const registerTaskElement = useCallback((taskId: string, element: HTMLElement | null) => {
    if (element) {
      taskElementsRef.current.set(taskId, element);
    } else {
      taskElementsRef.current.delete(taskId);
    }
  }, []);

  // Check if two rectangles intersect
  const rectsIntersect = useCallback(
    (selStart: { x: number; y: number }, selEnd: { x: number; y: number }, elementRect: DOMRect) => {
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
    },
    []
  );

  // Calculate which tasks are inside the selection box
  const updateSelection = useCallback(
    (start: { x: number; y: number }, end: { x: number; y: number }) => {
      const newSelected = new Set<string>();

      taskElementsRef.current.forEach((element, taskId) => {
        const rect = element.getBoundingClientRect();
        if (rectsIntersect(start, end, rect)) {
          newSelected.add(taskId);
        }
      });

      setSelectedTasks(newSelected);
    },
    [rectsIntersect]
  );

  // Marquee selection mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start selection on left click
    if (e.button !== 0) return;

    // Check if clicking on a task or interactive element
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-task-item]") ||
      target.closest("button") ||
      target.closest("[data-no-select]")
    ) {
      return;
    }

    // Start selection
    setIsSelecting(true);
    setSelectionStart({ x: e.clientX, y: e.clientY });
    setSelectionEnd({ x: e.clientX, y: e.clientY });
    setSelectedTasks(new Set());
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isSelecting || !selectionStart) return;

      const newEnd = { x: e.clientX, y: e.clientY };
      setSelectionEnd(newEnd);
      updateSelection(selectionStart, newEnd);
    },
    [isSelecting, selectionStart, updateSelection]
  );

  const handleMouseUp = useCallback(() => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  }, [isSelecting]);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isSelecting) {
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => window.removeEventListener("mouseup", handleGlobalMouseUp);
  }, [isSelecting]);

  // Clear selection on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedTasks(new Set());
        setIsSelecting(false);
        setSelectionStart(null);
        setSelectionEnd(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
    return tasks.find((t) => t.id === activeId) || null;
  }, [activeId, tasks]);

  // Get the tasks being dragged (either just the active one, or all selected if active is selected)
  const tasksBeingDragged = useMemo(() => {
    if (!activeId) return [];
    if (selectedTasks.has(activeId)) {
      return tasks.filter((t) => selectedTasks.has(t.id));
    }
    return tasks.filter((t) => t.id === activeId);
  }, [activeId, selectedTasks, tasks]);

  const handleTaskSelect = useCallback((taskId: string, e: React.MouseEvent) => {
    setSelectedTasks((prev) => {
      const next = new Set(prev);
      if (e.metaKey || e.ctrlKey) {
        // Toggle individual selection
        if (next.has(taskId)) {
          next.delete(taskId);
        } else {
          next.add(taskId);
        }
      } else {
        // Replace selection
        next.clear();
        next.add(taskId);
      }
      return next;
    });
  }, []);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const draggedId = event.active.id as string;
      setActiveId(draggedId);

      // If dragging a selected task, all selected tasks are being dragged
      // If dragging an unselected task, only that task is being dragged
      if (selectedTasks.has(draggedId)) {
        setDraggingTaskIds(new Set(selectedTasks));
      } else {
        setDraggingTaskIds(new Set([draggedId]));
      }
    },
    [selectedTasks]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setDraggingTaskIds(new Set());

      if (!over) return;

      const draggedId = active.id as string;
      const targetDropZoneId = over.id as string;

      // Extract date key from drop zone ID (handles both "YYYY-MM-DD" and "YYYY-MM-YYYY-MM-DD" formats)
      const dateKeyMatch = targetDropZoneId.match(/(\d{4}-\d{2}-\d{2})$/);
      if (!dateKeyMatch) {
        console.warn("Invalid drop zone ID:", targetDropZoneId);
        return;
      }
      
      const targetDateKey = dateKeyMatch[1];
      const newDate = new Date(targetDateKey + "T12:00:00");

      // Determine which tasks to move
      const taskIdsToMove = selectedTasks.has(draggedId)
        ? Array.from(selectedTasks)
        : [draggedId];

      // Optimistically update UI for all tasks being moved
      setOptimisticMoves((prev) => {
        const next = new Map(prev);
        taskIdsToMove.forEach((id) => next.set(id, targetDateKey));
        return next;
      });

      // Call the appropriate callback
      if (taskIdsToMove.length > 1 && onTasksMove) {
        onTasksMove(taskIdsToMove, newDate);
      } else if (onTaskMove) {
        onTaskMove(draggedId, newDate);
      }

      // Clear selection after move
      setSelectedTasks(new Set());
    },
    [selectedTasks, onTaskMove, onTasksMove]
  );

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
    setDraggingTaskIds(new Set());
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
          className="flex-1 overflow-y-auto overflow-x-hidden relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* Top Sentinel for loading previous months */}
          <div ref={topSentinelRef} className="h-px" />

          {/* Render all months */}
          {monthsToRender.map((month) => (
            <SingleMonth
              key={format(month, 'yyyy-MM')}
              month={month}
              tasksByDate={tasksByDate}
              selectedTasks={selectedTasks}
              draggingTaskIds={draggingTaskIds}
              onTaskSelect={handleTaskSelect}
              onTaskClick={onTaskClick}
              registerRef={registerTaskElement}
              todayRef={isSameMonth(month, new Date()) ? todayRef : undefined}
            />
          ))}

          {/* Bottom Sentinel for loading next months */}
          <div ref={bottomSentinelRef} className="h-px" />

          {/* Selection Box */}
          {isSelecting && selectionStart && selectionEnd && (
            <SelectionBox
              start={selectionStart}
              end={selectionEnd}
              containerRef={containerRef}
            />
          )}
        </div>
      </div>

      {/* Drag Overlay - follows cursor */}
      <DragOverlay>
        {activeTask ? (
          <div className="space-y-1">
            {tasksBeingDragged.length > 1 ? (
              // Show stacked preview for multiple tasks
              <div className="relative">
                <div className="px-3 py-2 rounded bg-[#222] shadow-xl border border-[#444] text-sm text-[#f5f5f5] cursor-grabbing font-medium">
                  {activeTask.name}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {tasksBeingDragged.length}
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 rounded bg-[#222] shadow-xl border border-[#444] text-sm text-[#f5f5f5] cursor-grabbing">
                <div className="flex items-center gap-2">
                  <span className={cn("text-[11px] font-mono", getStatusColor(activeTask.status))}>
                    {getStatusIndicator(activeTask.status)}
                  </span>
                  <span className="font-medium">{activeTask.name}</span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
