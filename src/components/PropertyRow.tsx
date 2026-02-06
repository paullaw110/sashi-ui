"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PropertyRowProps {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  className?: string;
}

export function PropertyRow({
  icon: Icon,
  label,
  children,
  isEmpty,
  className,
}: PropertyRowProps) {
  return (
    <div
      className={cn(
        "flex items-start py-2 hover:bg-[#161616] rounded-md px-2 -mx-2 transition-colors group min-h-[40px]",
        className
      )}
    >
      <div className="flex items-center gap-2 w-32 shrink-0 pt-1">
        <Icon size={14} className="text-[var(--text-tertiary)]" />
        <span className="text-xs text-[var(--text-tertiary)]">{label}</span>
      </div>
      <div className={cn("flex-1 min-w-0", isEmpty && "text-[#404040]")}>
        {children}
      </div>
    </div>
  );
}
