"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface RecurrenceEditorProps {
  value: string | null;
  onChange: (rule: string | null) => void;
  startDate: Date;
}

type Frequency = "none" | "daily" | "weekly" | "monthly" | "yearly";
type EndType = "never" | "on" | "after";

const WEEKDAYS = [
  { value: "MO", label: "M", fullLabel: "Monday" },
  { value: "TU", label: "T", fullLabel: "Tuesday" },
  { value: "WE", label: "W", fullLabel: "Wednesday" },
  { value: "TH", label: "T", fullLabel: "Thursday" },
  { value: "FR", label: "F", fullLabel: "Friday" },
  { value: "SA", label: "S", fullLabel: "Saturday" },
  { value: "SU", label: "S", fullLabel: "Sunday" },
];

// Parse RRULE string into component state
function parseRRule(rule: string | null): {
  frequency: Frequency;
  interval: number;
  weekdays: string[];
  endType: EndType;
  endDate: Date | null;
  endCount: number;
} {
  if (!rule) {
    return {
      frequency: "none",
      interval: 1,
      weekdays: [],
      endType: "never",
      endDate: null,
      endCount: 10,
    };
  }

  let frequency: Frequency = "none";
  let interval = 1;
  let weekdays: string[] = [];
  let endType: EndType = "never";
  let endDate: Date | null = null;
  let endCount = 10;

  // Parse frequency
  if (rule.includes("FREQ=DAILY")) frequency = "daily";
  else if (rule.includes("FREQ=WEEKLY")) frequency = "weekly";
  else if (rule.includes("FREQ=MONTHLY")) frequency = "monthly";
  else if (rule.includes("FREQ=YEARLY")) frequency = "yearly";

  // Parse interval
  const intervalMatch = rule.match(/INTERVAL=(\d+)/);
  if (intervalMatch) interval = parseInt(intervalMatch[1], 10);

  // Parse weekdays
  const bydayMatch = rule.match(/BYDAY=([A-Z,]+)/);
  if (bydayMatch) weekdays = bydayMatch[1].split(",");

  // Parse end condition
  const untilMatch = rule.match(/UNTIL=(\d{8})/);
  if (untilMatch) {
    endType = "on";
    const dateStr = untilMatch[1];
    endDate = new Date(
      parseInt(dateStr.slice(0, 4), 10),
      parseInt(dateStr.slice(4, 6), 10) - 1,
      parseInt(dateStr.slice(6, 8), 10)
    );
  }

  const countMatch = rule.match(/COUNT=(\d+)/);
  if (countMatch) {
    endType = "after";
    endCount = parseInt(countMatch[1], 10);
  }

  return { frequency, interval, weekdays, endType, endDate, endCount };
}

// Build RRULE string from component state
function buildRRule(
  frequency: Frequency,
  interval: number,
  weekdays: string[],
  endType: EndType,
  endDate: Date | null,
  endCount: number
): string | null {
  if (frequency === "none") return null;

  const parts: string[] = [];

  // Frequency
  parts.push(`FREQ=${frequency.toUpperCase()}`);

  // Interval (only if > 1)
  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  // Weekdays (for weekly frequency)
  if (frequency === "weekly" && weekdays.length > 0) {
    parts.push(`BYDAY=${weekdays.join(",")}`);
  }

  // End condition
  if (endType === "on" && endDate) {
    parts.push(`UNTIL=${format(endDate, "yyyyMMdd")}`);
  } else if (endType === "after" && endCount > 0) {
    parts.push(`COUNT=${endCount}`);
  }

  return parts.join(";");
}

export function RecurrenceEditor({
  value,
  onChange,
  startDate,
}: RecurrenceEditorProps) {
  const parsed = parseRRule(value);

  const [frequency, setFrequency] = useState<Frequency>(parsed.frequency);
  const [interval, setInterval] = useState(parsed.interval);
  const [weekdays, setWeekdays] = useState<string[]>(parsed.weekdays);
  const [endType, setEndType] = useState<EndType>(parsed.endType);
  const [endDate, setEndDate] = useState<Date | null>(parsed.endDate);
  const [endCount, setEndCount] = useState(parsed.endCount);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Update state when value prop changes
  useEffect(() => {
    const parsed = parseRRule(value);
    setFrequency(parsed.frequency);
    setInterval(parsed.interval);
    setWeekdays(parsed.weekdays);
    setEndType(parsed.endType);
    setEndDate(parsed.endDate);
    setEndCount(parsed.endCount);
  }, [value]);

  // Initialize weekdays from start date if empty
  useEffect(() => {
    if (frequency === "weekly" && weekdays.length === 0) {
      const dayIndex = startDate.getDay();
      const dayMap = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      setWeekdays([dayMap[dayIndex]]);
    }
  }, [frequency, startDate, weekdays.length]);

  const handleApply = useCallback(() => {
    const rule = buildRRule(frequency, interval, weekdays, endType, endDate, endCount);
    onChange(rule);
  }, [frequency, interval, weekdays, endType, endDate, endCount, onChange]);

  const handleFrequencyChange = useCallback((newFreq: Frequency) => {
    setFrequency(newFreq);
    if (newFreq === "none") {
      onChange(null);
    }
  }, [onChange]);

  const toggleWeekday = useCallback((day: string) => {
    setWeekdays((prev) => {
      if (prev.includes(day)) {
        // Don't allow removing all days
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day];
    });
  }, []);

  const getFrequencyLabel = () => {
    switch (frequency) {
      case "daily":
        return interval === 1 ? "day" : "days";
      case "weekly":
        return interval === 1 ? "week" : "weeks";
      case "monthly":
        return interval === 1 ? "month" : "months";
      case "yearly":
        return interval === 1 ? "year" : "years";
      default:
        return "";
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Frequency selector */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--text-tertiary)]">Repeats</label>
        <Select value={frequency} onValueChange={(v) => handleFrequencyChange(v as Frequency)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Does not repeat</SelectItem>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {frequency !== "none" && (
        <>
          {/* Interval */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)]">Every</label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={99}
                value={interval}
                onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20"
              />
              <span className="text-sm text-[var(--text-secondary)]">{getFrequencyLabel()}</span>
            </div>
          </div>

          {/* Weekday picker (for weekly) */}
          {frequency === "weekly" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-[var(--text-tertiary)]">On</label>
              <div className="flex gap-1">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleWeekday(day.value)}
                    title={day.fullLabel}
                    className={cn(
                      "w-8 h-8 rounded-full text-xs font-medium transition-colors",
                      weekdays.includes(day.value)
                        ? "bg-[var(--accent-primary)] text-white"
                        : "bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:bg-[var(--bg-surface)]"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* End condition */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--text-tertiary)]">Ends</label>
            <Select value={endType} onValueChange={(v) => setEndType(v as EndType)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="never">Never</SelectItem>
                <SelectItem value="on">On date</SelectItem>
                <SelectItem value="after">After occurrences</SelectItem>
              </SelectContent>
            </Select>

            {endType === "on" && (
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    {endDate ? format(endDate, "MMMM d, yyyy") : "Select end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarPicker
                    mode="single"
                    selected={endDate || undefined}
                    onSelect={(date) => {
                      setEndDate(date || null);
                      setEndDateOpen(false);
                    }}
                    disabled={(date) => date < startDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}

            {endType === "after" && (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={999}
                  value={endCount}
                  onChange={(e) => setEndCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20"
                />
                <span className="text-sm text-[var(--text-secondary)]">occurrences</span>
              </div>
            )}
          </div>

          {/* Apply button */}
          <Button onClick={handleApply} className="w-full">
            Apply
          </Button>
        </>
      )}
    </div>
  );
}
