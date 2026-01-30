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
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  closestCenter,
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
  organizationId: string | null;
  priority: string | null;
  status: string;
  dueDate: string | null;
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

// Get status display text
function getStatusDisplayText(status: string) {
  switch (status) {
    case "done":
      return "Done";
    case "in_progress":
      return "In Progress";
    case "waiting":
      return "Waiting";
    default:
      return "Not Started";
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
function TaskItem({
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
        "text-sm px-2 py-2 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)] cursor-grab active:cursor-grabbing text-[var(--text-primary)] transition-colors border border-transparent touch-none",
        task.status === "done" && "line-through text-[var(--text-tertiary)]",
        // Only non-negotiable gets a highlight
        task.priority === "non-negotiable" && "border-l-2 border-l-red-500/50",
        isSelected && "border-blue-500/30 bg-blue-500/10",
        (isDragging || isDraggedAlong) && "opacity-30"
      )}
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-medium">{task.name}</span>
          {task.dueTime && (
            <span className="text-xs text-[var(--text-tertiary)] ml-auto">
              {task.dueTime.substring(0, 5)}
            </span>
          )}
        </div>
        <span className="text-xs text-[var(--text-quaternary)]">
          {getStatusDisplayText(task.status)}
        </span>
      </div>
    </div>
  );
}

// Droppable day column
function DayColumn({
  day,
  tasks,
  isCurrentDay,
  selectedTasks,
  draggingTaskIds,
  onTaskSelect,
  onTaskClick,
  registerRef,
}: {
  day: Date;
  tasks: Task[];
  isCurrentDay: boolean;
  selectedTasks: Set<string>;
  draggingTaskIds: Set<string>;
  onTaskSelect: (taskId: string, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
  registerRef: (taskId: string, element: HTMLElement | null) => void;
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  const { setNodeRef, isOver } = useDroppable({
    id: dateKey,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "border-r border-[var(--border-subtle)] last:border-r-0 min-h-[180px] flex flex-col",
        isOver && "bg-blue-500/10"
      )}
    >
      {/* Day Header */}
      <div
        className={cn(
          "px-2 py-3 text-center border-b border-[var(--border-subtle)]",
          isCurrentDay && "bg-[var(--bg-surface)]"
        )}
      >
        <div className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest">
          {format(day, "EEE")}
        </div>
        <div
          className={cn(
            "text-lg mt-0.5 font-display",
            isCurrentDay ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)]"
          )}
        >
          {format(day, "d")}
        </div>
      </div>

      {/* Tasks Area */}
      <div className="flex-1 p-1.5 space-y-1 min-h-[100px]">
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
  onTasksMove,
}: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
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
      const targetDateKey = over.id as string;

      // Validate it's a date key (YYYY-MM-DD format)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDateKey)) return;

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

  // Set date on client only to avoid hydration mismatch
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  // Don't render until client-side date is set
  if (!currentDate) {
    return (
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] h-[300px] animate-pulse" />
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
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

        {/* Calendar Grid */}
        <div
          ref={calendarGridRef}
          className="grid grid-cols-7 relative"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
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
                selectedTasks={selectedTasks}
                draggingTaskIds={draggingTaskIds}
                onTaskSelect={handleTaskSelect}
                onTaskClick={onTaskClick}
                registerRef={registerTaskElement}
              />
            );
          })}

          {/* Selection Box */}
          {isSelecting && selectionStart && selectionEnd && (
            <SelectionBox
              start={selectionStart}
              end={selectionEnd}
              containerRef={calendarGridRef}
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
                <div className="px-3 py-2 rounded bg-[var(--bg-active)] shadow-xl border border-[#444] text-sm text-[var(--text-primary)] cursor-grabbing font-medium">
                  {activeTask.name}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                  {tasksBeingDragged.length}
                </div>
              </div>
            ) : (
              <div className="px-3 py-2 rounded bg-[var(--bg-active)] shadow-xl border border-[#444] text-sm text-[var(--text-primary)] cursor-grabbing font-medium">
                {activeTask.name}
              </div>
            )}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
