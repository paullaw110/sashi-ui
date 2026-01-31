"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagBadgeProps {
  name: string;
  color?: string | null;
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

export function TagBadge({
  name,
  color,
  size = "sm",
  removable = false,
  onRemove,
  onClick,
}: TagBadgeProps) {
  const sizeClasses = {
    sm: "text-[10px] px-1.5 py-0.5 gap-1",
    md: "text-xs px-2 py-1 gap-1.5",
  };

  // Default to gray if no color
  const bgColor = color || "#6B7280";
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded font-medium transition-colors",
        sizeClasses[size],
        onClick && "cursor-pointer hover:opacity-80"
      )}
      style={{
        backgroundColor: `${bgColor}20`,
        color: bgColor,
        border: `1px solid ${bgColor}40`,
      }}
      onClick={onClick}
    >
      #{name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-black/20 rounded p-0.5 -mr-0.5 transition-colors"
        >
          <X size={size === "sm" ? 10 : 12} />
        </button>
      )}
    </span>
  );
}

// Display multiple tags with overflow handling
export function TagList({
  tags,
  max = 3,
  size = "sm",
  removable = false,
  onRemove,
  onClick,
}: {
  tags: Array<{ id: string; name: string; color?: string | null }>;
  max?: number;
  size?: "sm" | "md";
  removable?: boolean;
  onRemove?: (tagId: string) => void;
  onClick?: (tagId: string) => void;
}) {
  const visibleTags = tags.slice(0, max);
  const overflow = tags.length - max;

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {visibleTags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          color={tag.color}
          size={size}
          removable={removable}
          onRemove={onRemove ? () => onRemove(tag.id) : undefined}
          onClick={onClick ? () => onClick(tag.id) : undefined}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-[var(--text-quaternary)]">
          +{overflow} more
        </span>
      )}
    </div>
  );
}
