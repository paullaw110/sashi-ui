"use client";

import { useState } from "react";
import { Filter, X, Check } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "./ui/drawer";
import { cn } from "@/lib/utils";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  options: FilterOption[];
  multiple?: boolean;
}

interface MobileFiltersProps {
  groups: FilterGroup[];
  values: Record<string, string | string[]>;
  onChange: (groupId: string, value: string | string[]) => void;
  onClear: () => void;
}

export function MobileFilters({
  groups,
  values,
  onChange,
  onClear,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  // Count active filters
  const activeCount = Object.values(values).reduce((count, val) => {
    if (Array.isArray(val)) return count + val.length;
    if (val && val !== "all") return count + 1;
    return count;
  }, 0);

  const handleOptionClick = (groupId: string, optionValue: string, multiple?: boolean) => {
    if (multiple) {
      const currentValues = (values[groupId] as string[]) || [];
      if (currentValues.includes(optionValue)) {
        onChange(
          groupId,
          currentValues.filter((v) => v !== optionValue)
        );
      } else {
        onChange(groupId, [...currentValues, optionValue]);
      }
    } else {
      onChange(groupId, optionValue);
    }
  };

  const isSelected = (groupId: string, optionValue: string, multiple?: boolean) => {
    if (multiple) {
      const currentValues = (values[groupId] as string[]) || [];
      return currentValues.includes(optionValue);
    }
    return values[groupId] === optionValue;
  };

  return (
    <>
      {/* Filter button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors",
          activeCount > 0
            ? "bg-[var(--accent)] text-[var(--bg-base)]"
            : "bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        )}
      >
        <Filter size={16} />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="ml-0.5 px-1.5 py-0.5 text-xs rounded-full bg-[var(--bg-base)] text-[var(--accent)]">
            {activeCount}
          </span>
        )}
      </button>

      {/* Filter drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader className="border-b border-[var(--border-subtle)]">
            <div className="flex items-center justify-between">
              <DrawerTitle>Filters</DrawerTitle>
              <button
                onClick={() => setOpen(false)}
                className="p-2 -mr-2 text-[var(--text-tertiary)]"
              >
                <X size={20} />
              </button>
            </div>
          </DrawerHeader>

          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {groups.map((group) => (
              <div key={group.id} className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                  {group.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {group.options.map((option) => {
                    const selected = isSelected(group.id, option.value, group.multiple);
                    return (
                      <button
                        key={option.value}
                        onClick={() =>
                          handleOptionClick(group.id, option.value, group.multiple)
                        }
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors",
                          selected
                            ? "bg-[var(--accent)] text-[var(--bg-base)]"
                            : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                        )}
                      >
                        {group.multiple && selected && <Check size={14} />}
                        <span>{option.label}</span>
                        {option.count !== undefined && (
                          <span
                            className={cn(
                              "text-xs",
                              selected
                                ? "text-[var(--bg-base)]/70"
                                : "text-[var(--text-quaternary)]"
                            )}
                          >
                            ({option.count})
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DrawerFooter className="border-t border-[var(--border-subtle)] flex-row gap-3">
            <button
              onClick={() => {
                onClear();
                setOpen(false);
              }}
              className="flex-1 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={() => setOpen(false)}
              className="flex-1 py-3 bg-[var(--accent)] text-[var(--bg-base)] rounded-lg font-medium"
            >
              Apply
            </button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
