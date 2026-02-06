"use client";

import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  avatar: string;
  status: "idle" | "active" | "blocked";
  sessionKey: string;
  model: string;
  currentTaskId: string | null;
  lastActiveAt: string | null;
  createdAt: string;
  currentTask?: {
    id: string;
    name: string;
  } | null;
}

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const statusColors = {
    active: "bg-lime-400",
    idle: "bg-zinc-500",
    blocked: "bg-red-400",
  };

  const statusLabels = {
    active: "Active",
    idle: "Idle",
    blocked: "Blocked",
  };

  return (
    <div
      className={cn(
        "relative rounded-lg border p-4 transition-all",
        agent.status === "active"
          ? "border-lime-500/30 bg-lime-500/5"
          : agent.status === "blocked"
          ? "border-red-500/30 bg-red-500/5"
          : "border-zinc-800 bg-zinc-900/50"
      )}
    >
      {/* Status indicator */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span
          className={cn(
            "w-2 h-2 rounded-full",
            statusColors[agent.status]
          )}
        />
        <span className="text-xs text-zinc-500">{statusLabels[agent.status]}</span>
      </div>

      {/* Avatar and name */}
      <div className="flex items-center gap-3 mb-2">
        <div className="text-2xl">{agent.avatar}</div>
        <div>
          <h3 className="font-medium text-zinc-100">{agent.name}</h3>
          <p className="text-xs text-zinc-500">{agent.role}</p>
        </div>
      </div>

      {/* Current task or last active */}
      {agent.status === "active" && agent.currentTask ? (
        <div className="mt-3">
          <p className="text-xs text-zinc-500 mb-1">Working on:</p>
          <p className="text-sm text-zinc-300 truncate">{agent.currentTask.name}</p>
        </div>
      ) : agent.lastActiveAt ? (
        <div className="mt-3">
          <p className="text-xs text-zinc-500">
            Last active{" "}
            {formatDistanceToNow(new Date(agent.lastActiveAt), { addSuffix: true })}
          </p>
        </div>
      ) : null}

      {/* Model badge */}
      <div className="mt-3 pt-3 border-t border-zinc-800/50">
        <span className="text-xs text-zinc-600 font-mono">
          {agent.model?.split("/").pop() || "default"}
        </span>
      </div>
    </div>
  );
}
