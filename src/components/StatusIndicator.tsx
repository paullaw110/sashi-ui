"use client";

import { useState, useEffect } from "react";
import { Circle, Loader2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface SashiStatus {
  state: "idle" | "working" | "waiting";
  task: string | null;
  startedAt: string | null;
  updatedAt: string;
}

export function StatusIndicator() {
  const [status, setStatus] = useState<SashiStatus | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/status");
        const data = await res.json();
        setStatus(data);
      } catch (e) {
        console.error("Failed to fetch status:", e);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const stateConfig = {
    idle: {
      icon: Circle,
      color: "text-[#404040]",
      bg: "bg-[#404040]",
      label: "Idle",
    },
    working: {
      icon: Loader2,
      color: "text-[var(--accent-primary)]",
      bg: "bg-[var(--accent-primary)]",
      label: "Working",
    },
    waiting: {
      icon: Clock,
      color: "text-[#737373]",
      bg: "bg-[#737373]",
      label: "Waiting",
    },
  };

  const config = stateConfig[status.state];
  const Icon = config.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-2 py-1 rounded hover:bg-[#1a1a1a] transition-colors"
      >
        <span className={cn("w-1.5 h-1.5 rounded-full", config.bg)} />
        <span className="text-[10px] text-[#525252]">{config.label}</span>
        {status.state === "working" && (
          <Icon size={10} className={cn(config.color, "animate-spin")} />
        )}
      </button>

      {expanded && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setExpanded(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-64 bg-[#111] border border-[#222] rounded-lg shadow-xl z-50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("w-2 h-2 rounded-full", config.bg)} />
              <span className="text-xs text-[#f5f5f5] font-medium">{config.label}</span>
            </div>
            
            {status.task && (
              <p className="text-[11px] text-[#a3a3a3] mb-2">
                {status.task}
              </p>
            )}
            
            {status.startedAt && status.state === "working" && (
              <p className="text-[10px] text-[#525252]">
                Started {formatDistanceToNow(new Date(status.startedAt), { addSuffix: true })}
              </p>
            )}
            
            <p className="text-[10px] text-[#333] mt-2">
              Updated {formatDistanceToNow(new Date(status.updatedAt), { addSuffix: true })}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
