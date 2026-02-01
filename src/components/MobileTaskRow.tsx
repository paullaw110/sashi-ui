"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { Check, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

interface Task {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: string | null;
  duration?: number | null;
  organizationId?: string | null;
  projectId?: string | null;
  [key: string]: unknown; // Allow additional properties
}

interface MobileTaskRowProps {
  task: Task;
  onComplete: (id: string) => void;
  onSelect: (task: Task) => void;
  onReschedule?: (id: string) => void;
}

export function MobileTaskRow({
  task,
  onComplete,
  onSelect,
  onReschedule,
}: MobileTaskRowProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isCompleting, setIsCompleting] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (e) => {
      // Limit swipe distance
      const offset = Math.min(Math.max(e.deltaX, -100), 100);
      setSwipeOffset(offset);
    },
    onSwipedRight: (e) => {
      if (e.deltaX > 80) {
        // Complete task
        setIsCompleting(true);
        setTimeout(() => {
          onComplete(task.id);
        }, 200);
      }
      setSwipeOffset(0);
    },
    onSwipedLeft: (e) => {
      if (e.deltaX < -80 && onReschedule) {
        onReschedule(task.id);
      }
      setSwipeOffset(0);
    },
    onTouchEndOrOnMouseUp: () => {
      if (Math.abs(swipeOffset) < 80) {
        setSwipeOffset(0);
      }
    },
    trackMouse: false,
    trackTouch: true,
  });

  const formatDueDate = (date: string | null) => {
    if (!date) return null;
    const d = parseISO(date);
    if (isToday(d)) return "Today";
    if (isTomorrow(d)) return "Tomorrow";
    return format(d, "MMM d");
  };

  const isOverdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
  const isDone = task.status === "done";

  const priorityColors: Record<string, string> = {
    urgent: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-blue-500",
  };

  return (
    <div className="relative overflow-hidden">
      {/* Swipe backgrounds */}
      <div
        className={cn(
          "absolute inset-y-0 left-0 flex items-center justify-start px-4 transition-opacity",
          swipeOffset > 40 ? "opacity-100" : "opacity-0"
        )}
        style={{ width: Math.abs(swipeOffset) }}
      >
        <div className="flex items-center gap-2 text-green-400">
          <Check size={20} />
          <span className="text-sm font-medium">Done</span>
        </div>
      </div>
      
      <div
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end px-4 transition-opacity",
          swipeOffset < -40 ? "opacity-100" : "opacity-0"
        )}
        style={{ width: Math.abs(swipeOffset) }}
      >
        <div className="flex items-center gap-2 text-blue-400">
          <span className="text-sm font-medium">Reschedule</span>
          <Calendar size={20} />
        </div>
      </div>

      {/* Task row */}
      <div
        {...handlers}
        onClick={() => !isCompleting && onSelect(task)}
        className={cn(
          "relative flex items-center gap-3 py-3.5 px-4 bg-[var(--bg-base)] transition-all active:bg-[var(--bg-hover)]",
          isCompleting && "opacity-50 translate-x-full",
          isDone && "opacity-60"
        )}
        style={{
          transform: `translateX(${swipeOffset}px)`,
          transition: swipeOffset === 0 ? "transform 0.2s ease-out" : "none",
        }}
      >
        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete(task.id);
          }}
          className={cn(
            "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
            isDone
              ? "bg-[var(--accent)] border-[var(--accent)]"
              : "border-[var(--border-strong)] hover:border-[var(--accent)]"
          )}
        >
          {isDone && <Check size={14} className="text-[var(--bg-base)]" />}
        </button>

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-[15px] text-[var(--text-primary)] leading-tight",
              isDone && "line-through text-[var(--text-tertiary)]"
            )}
          >
            {task.name}
          </p>
          
          {/* Meta info */}
          <div className="flex items-center gap-2 mt-1">
            {task.dueDate && (
              <span
                className={cn(
                  "text-xs",
                  isOverdue
                    ? "text-red-400"
                    : isToday(parseISO(task.dueDate))
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-tertiary)]"
                )}
              >
                {formatDueDate(task.dueDate)}
              </span>
            )}
            {task.duration && (
              <span className="text-xs text-[var(--text-quaternary)]">
                {task.duration}m
              </span>
            )}
          </div>
        </div>

        {/* Right side indicators */}
        <div className="flex items-center gap-2 shrink-0">
          {isOverdue && !isDone && (
            <AlertCircle size={16} className="text-red-400" />
          )}
          {task.priority && (
            <div
              className={cn(
                "w-2 h-2 rounded-full",
                priorityColors[task.priority] || "bg-gray-500"
              )}
            />
          )}
          <ChevronRight size={18} className="text-[var(--text-quaternary)]" />
        </div>
      </div>
    </div>
  );
}
