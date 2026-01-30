"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

type Option = {
  value: string;
  label: string;
  color?: string;
  dotColor?: string;
};

type OptionGroup = {
  label: string;
  options: Option[];
};

interface InlineSelectCellProps {
  type: "status" | "priority";
  taskId: string;
  currentValue: string | null;
  options: Option[] | OptionGroup[];
  onUpdate: (taskId: string, field: string, value: string | null) => Promise<void>;
  allowClear?: boolean;
}

// Check if options are grouped
function isGrouped(options: Option[] | OptionGroup[]): options is OptionGroup[] {
  return options.length > 0 && 'options' in options[0];
}

// Get display for current value
function getCurrentDisplay(value: string | null, options: Option[] | OptionGroup[]): Option | null {
  if (!value) return null;
  
  if (isGrouped(options)) {
    for (const group of options) {
      const found = group.options.find(o => o.value === value);
      if (found) return found;
    }
  } else {
    return options.find(o => o.value === value) || null;
  }
  return null;
}

// Status options (grouped like Notion)
export const STATUS_OPTIONS: OptionGroup[] = [
  {
    label: "To-do",
    options: [
      { value: "in_progress", label: "In Progress", dotColor: "bg-blue-400" },
      { value: "not_started", label: "Not Started", dotColor: "bg-neutral-400" },
      { value: "waiting", label: "Waiting", dotColor: "bg-amber-400" },
    ],
  },
  {
    label: "Complete",
    options: [
      { value: "done", label: "Done", dotColor: "bg-green-400" },
    ],
  },
];

// Priority options
export const PRIORITY_OPTIONS: Option[] = [
  { value: "non-negotiable", label: "Non-Negotiable", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "critical", label: "Critical", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  { value: "high", label: "High", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  { value: "low", label: "Low", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
];

export function InlineSelectCell({
  type,
  taskId,
  currentValue,
  options,
  onUpdate,
  allowClear = true,
}: InlineSelectCellProps) {
  const [open, setOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const fieldName = type === "status" ? "status" : "priority";
  const currentOption = getCurrentDisplay(currentValue, options);

  const handleSelect = useCallback(async (value: string | null) => {
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      await onUpdate(taskId, fieldName, value);
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to update ${type}`);
    } finally {
      setIsUpdating(false);
    }
  }, [taskId, fieldName, type, onUpdate, isUpdating]);

  // Render badge for status
  const renderStatusBadge = (option: Option | null) => {
    if (!option) {
      return <span className="text-xs text-[var(--text-quaternary)]">—</span>;
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]">
        <span className={cn("w-2 h-2 rounded-full", option.dotColor)} />
        {option.label}
      </span>
    );
  };

  // Render badge for priority
  const renderPriorityBadge = (option: Option | null) => {
    if (!option) {
      return <span className="text-xs text-[var(--text-quaternary)]">—</span>;
    }
    return (
      <span className={cn(
        "text-xs px-2 py-0.5 rounded border whitespace-nowrap",
        option.color
      )}>
        {option.label}
      </span>
    );
  };

  const renderTrigger = () => {
    if (type === "status") {
      return renderStatusBadge(currentOption);
    }
    return renderPriorityBadge(currentOption);
  };

  const renderOption = (option: Option) => {
    const isSelected = option.value === currentValue;
    
    if (type === "status") {
      return (
        <button
          key={option.value}
          onClick={() => handleSelect(option.value)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded hover:bg-[var(--bg-hover)] transition-colors",
            isSelected && "bg-[var(--bg-surface)]"
          )}
          disabled={isUpdating}
        >
          <span className={cn("w-2.5 h-2.5 rounded-full", option.dotColor)} />
          <span className={cn(
            "flex-1",
            isSelected ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"
          )}>
            {option.label}
          </span>
        </button>
      );
    }
    
    // Priority
    return (
      <button
        key={option.value}
        onClick={() => handleSelect(option.value)}
        className={cn(
          "w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded hover:bg-[var(--bg-hover)] transition-colors",
          isSelected && "bg-[var(--bg-surface)]"
        )}
        disabled={isUpdating}
      >
        <span className={cn(
          "text-xs px-2 py-0.5 rounded border",
          option.color
        )}>
          {option.label}
        </span>
      </button>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="hover:opacity-80 transition-opacity cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {renderTrigger()}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[200px] p-2 bg-[var(--bg-elevated)] border-[var(--border-default)]" 
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        {isGrouped(options) ? (
          // Grouped options (for status)
          <div className="space-y-3">
            {options.map((group, i) => (
              <div key={group.label}>
                <div className="px-2 py-1 text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider">
                  {group.label}
                </div>
                <div className="space-y-0.5">
                  {group.options.map(renderOption)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat options (for priority)
          <div className="space-y-0.5">
            {options.map(renderOption)}
          </div>
        )}
        
        {/* Clear option */}
        {allowClear && currentValue && type === "priority" && (
          <>
            <div className="my-2 border-t border-[var(--border-subtle)]" />
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left rounded text-red-400 hover:bg-red-500/10 transition-colors"
              disabled={isUpdating}
            >
              Clear
            </button>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
