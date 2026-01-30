"use client";

import { useState, useCallback, useMemo } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { toast } from "sonner";

type Organization = {
  id: string;
  name: string;
};

type Project = {
  id: string;
  name: string;
  organizationId: string | null;
};

interface InlineOrgProjectCellProps {
  type: "organization" | "project";
  taskId: string;
  currentId: string | null;
  currentName: string | null;
  organizationId?: string | null; // For project filtering
  organizations: Organization[];
  projects: Project[];
  onUpdate: (taskId: string, field: string, value: string | null) => Promise<void>;
}

export function InlineOrgProjectCell({
  type,
  taskId,
  currentId,
  currentName,
  organizationId,
  organizations,
  projects,
  onUpdate,
}: InlineOrgProjectCellProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const isOrg = type === "organization";
  const fieldName = isOrg ? "organizationId" : "projectId";
  const placeholder = isOrg ? "Search or create org..." : "Search or create project...";

  // Filter items based on search and (for projects) organization
  const items = useMemo(() => {
    if (isOrg) {
      return organizations;
    }
    // For projects, filter by organization if one is set
    return organizationId
      ? projects.filter((p) => p.organizationId === organizationId)
      : projects;
  }, [isOrg, organizations, projects, organizationId]);

  // Check if search matches existing item
  const searchLower = search.toLowerCase().trim();
  const exactMatch = items.some((item) => item.name.toLowerCase() === searchLower);
  const showCreate = search.trim() && !exactMatch;

  // Handle selecting existing item
  const handleSelect = useCallback(
    async (itemId: string) => {
      try {
        await onUpdate(taskId, fieldName, itemId);
        setOpen(false);
        setSearch("");
      } catch (error) {
        toast.error(`Failed to update ${type}`);
      }
    },
    [taskId, fieldName, type, onUpdate]
  );

  // Handle clearing selection
  const handleClear = useCallback(async () => {
    try {
      await onUpdate(taskId, fieldName, null);
      // If clearing org, also clear project
      if (isOrg) {
        await onUpdate(taskId, "projectId", null);
      }
      setOpen(false);
      setSearch("");
    } catch (error) {
      toast.error(`Failed to clear ${type}`);
    }
  }, [taskId, fieldName, isOrg, type, onUpdate]);

  // Handle creating new item
  const handleCreate = useCallback(async () => {
    if (!search.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const endpoint = isOrg ? "/api/organizations" : "/api/projects";
      const body = isOrg
        ? { name: search.trim() }
        : { name: search.trim(), organizationId: organizationId || null };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error("Failed to create");

      const data = await response.json();
      const newItem = isOrg ? data.organization : data.project;

      // Update task with new item
      await onUpdate(taskId, fieldName, newItem.id);
      
      toast.success(`Created "${newItem.name}"`);
      setOpen(false);
      setSearch("");
    } catch (error) {
      toast.error(`Failed to create ${type}`);
    } finally {
      setIsCreating(false);
    }
  }, [search, isCreating, isOrg, organizationId, taskId, fieldName, type, onUpdate]);

  return (
    <Popover open={open} onOpenChange={(o) => {
      setOpen(o);
      if (!o) setSearch("");
    }}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "text-left w-full px-2 py-1 rounded hover:bg-[var(--bg-hover)] transition-colors text-sm",
            currentName ? "text-[var(--text-secondary)]" : "text-[var(--text-quaternary)]"
          )}
        >
          {currentName || "—"}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[220px] p-0 bg-[var(--bg-elevated)] border-[var(--border-default)]" 
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command className="bg-transparent" shouldFilter={false}>
          <CommandInput
            placeholder={placeholder}
            value={search}
            onValueChange={setSearch}
            className="border-none focus:ring-0"
            onKeyDown={(e) => {
              if (e.key === "Enter" && showCreate) {
                e.preventDefault();
                handleCreate();
              }
            }}
          />
          <CommandList>
            {/* Create option */}
            {showCreate && (
              <CommandGroup>
                <CommandItem
                  onSelect={handleCreate}
                  disabled={isCreating}
                  className="cursor-pointer"
                >
                  <Plus size={14} className="mr-2 text-[var(--accent-primary)]" />
                  <span>Create</span>
                  <span className="ml-1 px-1.5 py-0.5 bg-[var(--bg-active)] rounded text-xs font-medium">
                    {search}
                  </span>
                </CommandItem>
              </CommandGroup>
            )}
            
            {showCreate && items.length > 0 && <CommandSeparator />}

            {/* Existing items */}
            {items.length > 0 && (
              <CommandGroup heading={items.length > 0 ? "Select" : undefined}>
                {items
                  .filter((item) =>
                    search ? item.name.toLowerCase().includes(searchLower) : true
                  )
                  .map((item) => (
                    <CommandItem
                      key={item.id}
                      value={item.name}
                      onSelect={() => handleSelect(item.id)}
                      className="cursor-pointer"
                    >
                      {item.name}
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {/* Clear option */}
            {currentId && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="text-red-400 cursor-pointer"
                  >
                    <X size={14} className="mr-2" />
                    Clear
                  </CommandItem>
                </CommandGroup>
              </>
            )}

            {/* Empty state */}
            {items.length === 0 && !showCreate && (
              <div className="py-6 text-center text-sm text-[var(--text-quaternary)]">
                {isOrg ? "No organizations" : "No projects"}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
