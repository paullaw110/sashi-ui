"use client";

import { useState, useCallback, useEffect } from "react";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { TagBadge } from "./TagBadge";
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

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

interface TagInputProps {
  taskId: string;
  tags: Tag[];
  allTags: Tag[];
  onAdd: (tagId: string, name?: string) => Promise<void>;
  onRemove: (tagId: string) => Promise<void>;
  onRefreshTags?: () => void;
}

export function TagInput({
  taskId,
  tags,
  allTags,
  onAdd,
  onRemove,
  onRefreshTags,
}: TagInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Filter out tags already on this task
  const availableTags = allTags.filter(
    (tag) => !tags.some((t) => t.id === tag.id)
  );

  // Filter by search
  const filteredTags = availableTags.filter((tag) =>
    tag.name.toLowerCase().includes(search.toLowerCase())
  );

  // Check if search matches existing tag
  const searchNormalized = search.trim().toLowerCase().replace(/\s+/g, "-");
  const exactMatch = allTags.some((tag) => tag.name === searchNormalized);
  const showCreate = search.trim() && !exactMatch;

  const handleSelect = useCallback(
    async (tagId: string) => {
      setIsAdding(true);
      try {
        await onAdd(tagId);
        onRefreshTags?.();
      } finally {
        setIsAdding(false);
        setSearch("");
      }
    },
    [onAdd, onRefreshTags]
  );

  const handleCreate = useCallback(async () => {
    if (!search.trim() || isAdding) return;
    setIsAdding(true);
    try {
      await onAdd("", search.trim());
      onRefreshTags?.();
      setOpen(false);
    } finally {
      setIsAdding(false);
      setSearch("");
    }
  }, [search, isAdding, onAdd, onRefreshTags]);

  const handleRemove = useCallback(
    async (tagId: string) => {
      await onRemove(tagId);
      onRefreshTags?.();
    },
    [onRemove, onRefreshTags]
  );

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {/* Existing tags */}
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          size="md"
          removable
          onRemove={() => handleRemove(tag.id)}
        />
      ))}

      {/* Add tag button */}
      <Popover open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSearch("");
      }}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "inline-flex items-center gap-1 text-xs px-2 py-1 rounded",
              "text-[var(--text-quaternary)] hover:text-[var(--text-secondary)]",
              "hover:bg-[var(--bg-surface)] transition-colors"
            )}
          >
            <Plus size={12} />
            Add tag
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[220px] p-0 bg-[var(--bg-elevated)] border-[var(--border-default)]"
          align="start"
        >
          <Command className="bg-transparent" shouldFilter={false}>
            <CommandInput
              placeholder="Search or create tag..."
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
                    disabled={isAdding}
                    className="cursor-pointer"
                  >
                    {isAdding ? (
                      <Loader2 size={14} className="mr-2 animate-spin" />
                    ) : (
                      <Plus size={14} className="mr-2 text-[var(--accent-primary)]" />
                    )}
                    <span>Create</span>
                    <span className="ml-1 px-1.5 py-0.5 bg-[var(--bg-active)] rounded text-xs font-medium">
                      #{searchNormalized}
                    </span>
                  </CommandItem>
                </CommandGroup>
              )}

              {showCreate && filteredTags.length > 0 && <CommandSeparator />}

              {/* Existing tags */}
              {filteredTags.length > 0 && (
                <CommandGroup heading="Tags">
                  {filteredTags.map((tag) => (
                    <CommandItem
                      key={tag.id}
                      value={tag.id}
                      onSelect={() => handleSelect(tag.id)}
                      className="cursor-pointer"
                    >
                      <span
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: tag.color || "#6B7280" }}
                      />
                      #{tag.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Empty state */}
              {filteredTags.length === 0 && !showCreate && (
                <div className="py-6 text-center text-sm text-[var(--text-quaternary)]">
                  No tags found
                </div>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
