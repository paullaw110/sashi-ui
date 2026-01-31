"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Smile, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Dynamically import emoji-mart to avoid SSR issues
const Picker = dynamic(
  () => import("@emoji-mart/react").then((mod) => mod.default),
  { ssr: false, loading: () => <div className="w-[352px] h-[435px] bg-[var(--bg-surface)]" /> }
);

interface EmojiPickerProps {
  value?: string | null;
  onChange: (emoji: string | null) => void;
  placeholder?: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function EmojiPicker({
  value,
  onChange,
  placeholder,
  size = "md",
}: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (emoji: { native: string }) => {
    onChange(emoji.native);
    setOpen(false);
  };

  const handleRemove = () => {
    onChange(null);
    setOpen(false);
  };

  const sizeClasses = {
    sm: "w-6 h-6 text-sm",
    md: "w-8 h-8 text-lg",
    lg: "w-10 h-10 text-2xl",
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center rounded-md hover:bg-[var(--bg-surface)] transition-colors",
            sizeClasses[size],
            !value && "text-[var(--text-quaternary)]"
          )}
        >
          {value || placeholder || <Smile size={size === "sm" ? 14 : size === "md" ? 18 : 22} />}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-[var(--border-default)] bg-[var(--bg-elevated)]"
        align="start"
        sideOffset={5}
      >
        <div className="relative">
          <Picker
            data={async () => {
              const response = await import("@emoji-mart/data");
              return response.default;
            }}
            onEmojiSelect={handleSelect}
            theme="dark"
            previewPosition="none"
            skinTonePosition="none"
            navPosition="bottom"
            perLine={9}
            emojiSize={22}
            emojiButtonSize={32}
          />
          {value && (
            <div className="absolute bottom-0 left-0 right-0 p-2 border-t border-[var(--border-default)] bg-[var(--bg-elevated)]">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
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

// Inline emoji display with optional picker
export function IconDisplay({
  icon,
  fallback,
  size = "md",
  editable = false,
  onChange,
}: {
  icon?: string | null;
  fallback?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  editable?: boolean;
  onChange?: (icon: string | null) => void;
}) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl",
  };

  if (editable && onChange) {
    return (
      <EmojiPicker
        value={icon}
        onChange={onChange}
        placeholder={fallback}
        size={size}
      />
    );
  }

  return (
    <span className={cn(sizeClasses[size], !icon && "text-[var(--text-quaternary)]")}>
      {icon || fallback}
    </span>
  );
}
