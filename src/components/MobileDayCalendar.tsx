"use client";

import { useState } from "react";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, addDays, subDays, isToday, isSameDay, parseISO, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { MobileTaskRow } from "./MobileTaskRow";
import { PullToRefresh } from "./PullToRefresh";

interface Task {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dueDate: string | null;
  duration?: number | null;
  [key: string]: unknown; // Allow additional properties
}

interface MobileDayCalendarProps {
  tasks: Task[];
  onSelectTask: (task: Task) => void;
  onCompleteTask: (id: string) => void;
  onDateChange?: (date: Date) => void;
  onRefresh?: () => Promise<void>;
}

export function MobileDayCalendar({
  tasks,
  onSelectTask,
  onCompleteTask,
  onDateChange,
  onRefresh,
}: MobileDayCalendarProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlers = useSwipeable({
    onSwipedLeft: () => goToNextDay(),
    onSwipedRight: () => goToPrevDay(),
    trackMouse: false,
    trackTouch: true,
    delta: 50,
  });

  const goToPrevDay = () => {
    const newDate = subDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const goToNextDay = () => {
    const newDate = addDays(selectedDate, 1);
    setSelectedDate(newDate);
    onDateChange?.(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setSelectedDate(today);
    onDateChange?.(today);
  };

  // Filter tasks for selected date
  const dayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false;
    return isSameDay(parseISO(task.dueDate), selectedDate);
  });

  // Tasks without due date
  const unscheduledTasks = tasks.filter((task) => !task.dueDate);

  // Group by time
  const timeSlots: { hour: number; tasks: Task[] }[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    const slotTasks = dayTasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = parseISO(task.dueDate);
      return taskDate.getHours() === hour;
    });
    if (slotTasks.length > 0) {
      timeSlots.push({ hour, tasks: slotTasks });
    }
  }

  // Tasks scheduled for the day but no specific time
  const allDayTasks = dayTasks.filter((task) => {
    if (!task.dueDate) return false;
    const taskDate = parseISO(task.dueDate);
    // Consider it "all day" if it's at midnight
    return taskDate.getHours() === 0 && taskDate.getMinutes() === 0;
  });

  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour < 12) return `${hour}am`;
    if (hour === 12) return "12pm";
    return `${hour - 12}pm`;
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-base)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <button
          onClick={goToPrevDay}
          className="p-2 -ml-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:bg-[var(--bg-hover)] rounded-lg"
        >
          <ChevronLeft size={24} />
        </button>

        <button
          onClick={() => setShowDatePicker(!showDatePicker)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[var(--bg-hover)] active:bg-[var(--bg-hover)]"
        >
          <span
            className={cn(
              "font-display text-lg",
              isToday(selectedDate)
                ? "text-[var(--accent)]"
                : "text-[var(--text-primary)]"
            )}
          >
            {isToday(selectedDate)
              ? "Today"
              : format(selectedDate, "EEE, MMM d")}
          </span>
          <CalendarIcon size={18} className="text-[var(--text-tertiary)]" />
        </button>

        <button
          onClick={goToNextDay}
          className="p-2 -mr-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] active:bg-[var(--bg-hover)] rounded-lg"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* Date picker */}
      {showDatePicker && (
        <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={format(selectedDate, "yyyy-MM-dd")}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                setSelectedDate(newDate);
                onDateChange?.(newDate);
                setShowDatePicker(false);
              }}
              className="flex-1 px-3 py-2 bg-[var(--bg-base)] rounded-lg text-[var(--text-primary)] border border-[var(--border-default)]"
            />
            {!isToday(selectedDate) && (
              <button
                onClick={() => {
                  goToToday();
                  setShowDatePicker(false);
                }}
                className="px-3 py-2 text-sm text-[var(--accent)] hover:underline"
              >
                Today
              </button>
            )}
          </div>
        </div>
      )}

      {/* Day content - swipeable with pull to refresh */}
      <PullToRefresh onRefresh={onRefresh || (async () => {})} className="flex-1">
        <div {...handlers} className="h-full overflow-y-auto">
        {dayTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center px-4">
            <p className="text-[var(--text-tertiary)]">
              No tasks scheduled for {isToday(selectedDate) ? "today" : format(selectedDate, "MMM d")}
            </p>
            <p className="text-xs text-[var(--text-quaternary)] mt-1">
              Swipe left/right to change days
            </p>
          </div>
        ) : (
          <>
            {/* All day tasks */}
            {allDayTasks.length > 0 && (
              <div className="border-b border-[var(--border-subtle)]">
                <div className="px-4 py-2 text-xs font-medium text-[var(--text-quaternary)] uppercase tracking-wider bg-[var(--bg-subtle)]">
                  All Day
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                  {allDayTasks.map((task) => (
                    <MobileTaskRow
                      key={task.id}
                      task={task}
                      onComplete={onCompleteTask}
                      onSelect={onSelectTask}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Time-based tasks */}
            {timeSlots.map(({ hour, tasks: slotTasks }) => (
              <div key={hour} className="border-b border-[var(--border-subtle)]">
                <div className="flex">
                  <div className="w-16 shrink-0 px-3 py-3 text-xs text-[var(--text-quaternary)] text-right">
                    {formatHour(hour)}
                  </div>
                  <div className="flex-1 divide-y divide-[var(--border-subtle)]">
                    {slotTasks.map((task) => (
                      <MobileTaskRow
                        key={task.id}
                        task={task}
                        onComplete={onCompleteTask}
                        onSelect={onSelectTask}
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Tasks with date but shown as list (no specific time) */}
            {timeSlots.length === 0 && allDayTasks.length === 0 && (
              <div className="divide-y divide-[var(--border-subtle)]">
                {dayTasks.map((task) => (
                  <MobileTaskRow
                    key={task.id}
                    task={task}
                    onComplete={onCompleteTask}
                    onSelect={onSelectTask}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* Unscheduled tasks section */}
        {unscheduledTasks.length > 0 && (
          <div className="mt-4 border-t border-[var(--border-subtle)]">
            <div className="px-4 py-2 text-xs font-medium text-[var(--text-quaternary)] uppercase tracking-wider bg-[var(--bg-subtle)]">
              Unscheduled ({unscheduledTasks.length})
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {unscheduledTasks.slice(0, 5).map((task) => (
                <MobileTaskRow
                  key={task.id}
                  task={task}
                  onComplete={onCompleteTask}
                  onSelect={onSelectTask}
                />
              ))}
              {unscheduledTasks.length > 5 && (
                <div className="px-4 py-3 text-sm text-[var(--text-tertiary)] text-center">
                  +{unscheduledTasks.length - 5} more unscheduled
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </PullToRefresh>
    </div>
  );
}
