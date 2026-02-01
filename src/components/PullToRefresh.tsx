"use client";

import { ReactNode } from "react";
import { RefreshCw } from "lucide-react";
import { usePullToRefresh } from "@/lib/hooks/use-pull-to-refresh";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
}: PullToRefreshProps) {
  const { isPulling, isRefreshing, pullDistance, pullProgress, handlers } =
    usePullToRefresh({
      onRefresh,
      threshold: 80,
      maxPull: 150,
    });

  return (
    <div
      className={cn("relative overflow-auto", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center transition-opacity z-10",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -40,
          height: 40,
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-default)] shadow-lg",
            isRefreshing && "animate-pulse"
          )}
        >
          <RefreshCw
            size={16}
            className={cn(
              "text-[var(--text-tertiary)] transition-transform",
              isRefreshing && "animate-spin",
              pullProgress >= 1 && !isRefreshing && "text-[var(--accent)]"
            )}
            style={{
              transform: isRefreshing
                ? undefined
                : `rotate(${pullProgress * 360}deg)`,
            }}
          />
        </div>
      </div>

      {/* Content with pull transform */}
      <div
        style={{
          transform:
            pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: isPulling ? "none" : "transform 0.2s ease-out",
        }}
      >
        {children}
      </div>
    </div>
  );
}
