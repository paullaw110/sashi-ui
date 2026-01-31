"use client";

import { useState, useRef, useEffect } from "react";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Building2, Folder, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  value: string | null;
  onChange: (emoji: string | null) => void;
  type?: "organization" | "project";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

export function EmojiPicker({
  value,
  onChange,
  type = "organization",
  size = "md",
  disabled = false,
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: { native: string }) => {
    onChange(emoji.native);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setOpen(false);
  };

  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-8 h-8 text-lg",
    lg: "w-10 h-10 text-2xl",
  };

  const DefaultIcon = type === "organization" ? Building2 : Folder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex items-center justify-center rounded-lg transition-colors",
            "hover:bg-[var(--bg-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
            disabled && "opacity-50 cursor-not-allowed",
            sizeClasses[size]
          )}
        >
          {value ? (
            <span className="leading-none">{value}</span>
          ) : (
            <DefaultIcon
              className={cn(
                "text-[var(--text-quaternary)]",
                size === "sm" && "w-4 h-4",
                size === "md" && "w-5 h-5",
                size === "lg" && "w-6 h-6"
              )}
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-[var(--border-strong)] bg-[var(--bg-elevated)]"
        align="start"
        sideOffset={4}
      >
        <div className="relative">
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="bottom"
            perLine={8}
            maxFrequentRows={2}
            emojiButtonSize={32}
            emojiSize={20}
          />
          {value && (
            <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="w-full text-red-400 hover:text-red-300 hover:bg-red-400/10"
              >
                <X size={14} className="mr-2" />
                Remove icon
              </Button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Simple display-only icon component
interface IconDisplayProps {
  icon: string | null;
  type?: "organization" | "project";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function IconDisplay({
  icon,
  type = "organization",
  size = "md",
  className,
}: IconDisplayProps) {
  const sizeClasses = {
    xs: "text-xs",
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  const iconSizes = {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
  };

  const DefaultIcon = type === "organization" ? Building2 : Folder;

  if (icon) {
    return <span className={cn(sizeClasses[size], className)}>{icon}</span>;
  }

  return (
    <DefaultIcon
      size={iconSizes[size]}
      className={cn("text-[var(--text-quaternary)]", className)}
    />
  );
}
