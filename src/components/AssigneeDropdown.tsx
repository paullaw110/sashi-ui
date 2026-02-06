"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { UserCircle, Check, X } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

interface AssigneeDropdownProps {
  taskId: string;
  currentAgentId: string | null;
  currentAgent?: Agent | null;
  onAssign?: (agentId: string | null) => void;
  compact?: boolean;
}

export function AssigneeDropdown({
  taskId,
  currentAgentId,
  currentAgent,
  onAssign,
  compact = false,
}: AssigneeDropdownProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
  });

  const assignMutation = useMutation({
    mutationFn: async (agentId: string | null) => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedAgentId: agentId }),
      });
      if (!res.ok) throw new Error("Failed to assign task");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
  });

  const handleAssign = (agentId: string | null) => {
    assignMutation.mutate(agentId);
    onAssign?.(agentId);
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 rounded-md transition-colors",
            compact
              ? "p-1 hover:bg-zinc-800"
              : "px-2 py-1 hover:bg-zinc-800 border border-zinc-800",
            currentAgentId ? "text-zinc-300" : "text-zinc-500"
          )}
        >
          {currentAgent ? (
            <>
              <span className="text-base">{currentAgent.avatar}</span>
              {!compact && (
                <span className="text-sm">{currentAgent.name}</span>
              )}
            </>
          ) : (
            <>
              <UserCircle className="w-4 h-4" />
              {!compact && <span className="text-sm">Unassigned</span>}
            </>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {agents.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => handleAssign(agent.id)}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{agent.avatar}</span>
              <div>
                <div className="text-sm">{agent.name}</div>
                <div className="text-xs text-zinc-500">{agent.role}</div>
              </div>
            </div>
            {currentAgentId === agent.id && (
              <Check className="w-4 h-4 text-lime-400" />
            )}
          </DropdownMenuItem>
        ))}
        {currentAgentId && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAssign(null)}
              className="text-zinc-500"
            >
              <X className="w-4 h-4 mr-2" />
              Remove assignee
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
