"use client";

import { useCallback, useEffect, useRef } from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Organization, Project } from "@/lib/db/schema";

interface FilterState {
  searchQuery: string;
  status: string | null;
  priority: string | null;
  projectId: string | null;
  organizationId: string | null;
}

interface TaskSearchFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearAll: () => void;
  projects: Project[];
  organizations: Organization[];
  taskCount: number;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Todo", color: "bg-[var(--bg-surface)] text-[var(--text-tertiary)] border-[var(--border-default)]" },
  { value: "in_progress", label: "In Progress", color: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  { value: "waiting", label: "Waiting", color: "bg-amber-500/15 text-amber-400 border-amber-500/20" },
  { value: "done", label: "Done", color: "bg-green-500/15 text-green-400 border-green-500/20" },
];

const PRIORITY_OPTIONS = [
  { value: "non-negotiable", label: "Non-Negotiable", color: "bg-red-500/15 text-red-400 border-red-500/30" },
  { value: "critical", label: "Critical", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  { value: "high", label: "High", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { value: "medium", label: "Medium", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  { value: "low", label: "Low", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
];

function FilterChip({ 
  label, 
  colorClass, 
  onRemove 
}: { 
  label: string; 
  colorClass: string; 
  onRemove: () => void;
}) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition-colors",
      colorClass
    )}>
      {label}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="hover:opacity-70 transition-opacity"
      >
        <X size={10} />
      </button>
    </span>
  );
}

export function TaskSearchFilterBar({
  filters,
  onFiltersChange,
  onClearAll,
  projects,
  organizations,
  taskCount,
  className,
}: TaskSearchFilterBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd/Ctrl+F to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeFilters: { key: keyof FilterState; label: string; colorClass: string }[] = [];

  // Collect active filters for chip display
  if (filters.status) {
    const opt = STATUS_OPTIONS.find(o => o.value === filters.status);
    if (opt) {
      activeFilters.push({ key: "status", label: opt.label, colorClass: opt.color });
    }
  }

  if (filters.priority) {
    const opt = PRIORITY_OPTIONS.find(o => o.value === filters.priority);
    if (opt) {
      activeFilters.push({ key: "priority", label: opt.label, colorClass: opt.color });
    }
  }

  if (filters.projectId) {
    const project = projects.find(p => p.id === filters.projectId);
    if (project) {
      activeFilters.push({ 
        key: "projectId", 
        label: project.name, 
        colorClass: "bg-purple-500/15 text-purple-400 border-purple-500/30" 
      });
    }
  }

  if (filters.organizationId) {
    const org = organizations.find(o => o.id === filters.organizationId);
    if (org) {
      activeFilters.push({ 
        key: "organizationId", 
        label: org.name, 
        colorClass: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30" 
      });
    }
  }

  const hasActiveFilters = filters.searchQuery || activeFilters.length > 0;

  const handleRemoveFilter = useCallback((key: keyof FilterState) => {
    if (key === "searchQuery") {
      onFiltersChange({ searchQuery: "" });
    } else {
      onFiltersChange({ [key]: null });
    }
  }, [onFiltersChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Main Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-quaternary)]" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search tasks... (⌘F)"
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ searchQuery: e.target.value })}
            className="w-full text-xs text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] pl-9 pr-8 py-2 rounded-lg hover:border-[var(--border-strong)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/20 focus:outline-none transition-all"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onFiltersChange({ searchQuery: "" })}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[var(--text-quaternary)]">
            <Filter size={12} />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ""}
            onChange={(e) => onFiltersChange({ status: e.target.value || null })}
            className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-2.5 py-2 rounded-lg hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
          >
            <option value="">Status</option>
            {STATUS_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority || ""}
            onChange={(e) => onFiltersChange({ priority: e.target.value || null })}
            className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-2.5 py-2 rounded-lg hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer"
          >
            <option value="">Priority</option>
            {PRIORITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Project Filter */}
          {projects.length > 0 && (
            <select
              value={filters.projectId || ""}
              onChange={(e) => onFiltersChange({ projectId: e.target.value || null })}
              className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-2.5 py-2 rounded-lg hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer max-w-[140px]"
            >
              <option value="">Project</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Organization Filter */}
          {organizations.length > 0 && (
            <select
              value={filters.organizationId || ""}
              onChange={(e) => onFiltersChange({ organizationId: e.target.value || null })}
              className="text-xs text-[var(--text-tertiary)] bg-[var(--bg-elevated)] border border-[var(--border-default)] px-2.5 py-2 rounded-lg hover:border-[var(--border-strong)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors cursor-pointer max-w-[140px]"
            >
              <option value="">Organization</option>
              {organizations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          )}
        </div>

        {/* Task Count & Clear */}
        <div className="flex items-center gap-3 ml-auto">
          <span className="text-xs text-[var(--text-quaternary)]">
            {taskCount} task{taskCount !== 1 ? "s" : ""}
          </span>
          
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-1.5 text-xs text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] border border-[var(--border-default)] hover:border-[var(--border-strong)] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <X size={12} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-[var(--text-quaternary)] uppercase tracking-wider">Active:</span>
          {activeFilters.map(({ key, label, colorClass }) => (
            <FilterChip
              key={key}
              label={label}
              colorClass={colorClass}
              onRemove={() => handleRemoveFilter(key)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
