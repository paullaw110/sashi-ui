"use client";

import { useState, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { TagBadge } from "./TagBadge";
import { X, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

type Tag = {
  id: string;
  name: string;
  color?: string | null;
};

interface InlineTagCellProps {
  taskId: string;
  currentTags: Tag[];
  onTagsChange?: () => void;
}

export function InlineTagCell({
  taskId,
  currentTags,
  onTagsChange,
}: InlineTagCellProps) {
  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [localTags, setLocalTags] = useState<Tag[]>(currentTags);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sync local tags with props
  useEffect(() => {
    setLocalTags(currentTags);
  }, [currentTags]);

  // Fetch all tags when popover opens
  useEffect(() => {
    if (open) {
      fetch("/api/tags")
        .then(res => res.json())
        .then(data => setAllTags(data.tags || []))
        .catch(() => setAllTags([]));
    }
  }, [open]);

  // Add tag to task
  const handleAddTag = async (tagId: string, name?: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tagId ? { tagId } : { name }),
      });
      if (res.ok) {
        const { tag } = await res.json();
        if (tag) {
          setLocalTags(prev => [...prev, tag]);
          // Refresh all tags list if we created a new one
          if (!tagId) {
            const tagsRes = await fetch("/api/tags");
            const tagsData = await tagsRes.json();
            setAllTags(tagsData.tags || []);
          }
          onTagsChange?.();
        }
      }
    } catch {
      toast.error("Failed to add tag");
    } finally {
      setIsLoading(false);
      setSearch("");
    }
  };

  // Remove tag from task
  const handleRemoveTag = async (tagId: string) => {
    setIsLoading(true);
    try {
      await fetch(`/api/tasks/${taskId}/tags?tagId=${tagId}`, {
        method: "DELETE",
      });
      setLocalTags(prev => prev.filter(t => t.id !== tagId));
      onTagsChange?.();
    } catch {
      toast.error("Failed to remove tag");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter available tags (exclude already added)
  const availableTags = allTags.filter(
    tag => !localTags.some(t => t.id === tag.id)
  );

  // Check if search matches existing tag
  const searchNormalized = search.trim().toLowerCase().replace(/\s+/g, "-");
  const tagExists = allTags.some(t => t.name === searchNormalized);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="hover:opacity-80 transition-opacity cursor-pointer w-full text-left"
          onClick={(e) => e.stopPropagation()}
        >
          {localTags.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {localTags.slice(0, 2).map(tag => (
                <TagBadge key={tag.id} name={tag.name} color={tag.color} size="sm" />
              ))}
              {localTags.length > 2 && (
                <span className="text-[10px] text-[var(--text-quaternary)]">
                  +{localTags.length - 2}
                </span>
              )}
            </div>
          ) : (
            <span className="inline-block w-full h-7" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[220px] p-0 bg-[var(--bg-elevated)] border-[var(--border-default)]"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search or create tag..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {/* Current tags with remove option */}
            {localTags.length > 0 && (
              <CommandGroup heading="Current">
                {localTags.map(tag => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between px-2 py-1.5"
                  >
                    <TagBadge name={tag.name} color={tag.color} size="sm" />
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="text-[var(--text-quaternary)] hover:text-red-400 transition-colors"
                      disabled={isLoading}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </CommandGroup>
            )}

            {/* Available tags to add */}
            {availableTags.length > 0 && (
              <CommandGroup heading="Add tag">
                {availableTags
                  .filter(t => !search || t.name.includes(searchNormalized))
                  .slice(0, 5)
                  .map(tag => (
                    <CommandItem
                      key={tag.id}
                      value={tag.name}
                      onSelect={() => handleAddTag(tag.id)}
                      disabled={isLoading}
                      className="cursor-pointer"
                    >
                      <TagBadge name={tag.name} color={tag.color} size="sm" />
                    </CommandItem>
                  ))}
              </CommandGroup>
            )}

            {/* Create new tag option */}
            {search.trim() && !tagExists && (
              <CommandGroup>
                <CommandItem
                  value={`create-${search}`}
                  onSelect={() => handleAddTag("", search.trim())}
                  disabled={isLoading}
                  className="cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={14} className="mr-2 animate-spin" />
                  ) : (
                    <Plus size={14} className="mr-2" />
                  )}
                  Create &quot;#{searchNormalized}&quot;
                </CommandItem>
              </CommandGroup>
            )}

            <CommandEmpty>
              {search ? "No matching tags" : "No tags available"}
            </CommandEmpty>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
