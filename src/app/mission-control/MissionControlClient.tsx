"use client";

import { useQuery } from "@tanstack/react-query";
import { AgentCard } from "@/components/AgentCard";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

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

interface ActivityItem {
  id: string;
  type: string;
  agentId: string | null;
  taskId: string | null;
  message: string;
  metadata: string | null;
  createdAt: string;
  agent: {
    id: string;
    name: string;
    avatar: string;
    role: string;
  } | null;
  task: {
    id: string;
    name: string;
  } | null;
}

export default function MissionControlClient() {
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["agents"],
    queryFn: async () => {
      const res = await fetch("/api/agents");
      if (!res.ok) throw new Error("Failed to fetch agents");
      return res.json();
    },
    refetchInterval: 10000, // Poll every 10s for status updates
  });

  const { data: activity = [], isLoading: activityLoading } = useQuery<ActivityItem[]>({
    queryKey: ["activity"],
    queryFn: async () => {
      const res = await fetch("/api/activity?limit=50");
      if (!res.ok) throw new Error("Failed to fetch activity");
      return res.json();
    },
    refetchInterval: 5000, // Poll every 5s for new activity
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <h1 className="text-xl font-semibold text-zinc-100">Mission Control</h1>
        <Button size="sm" className="bg-lime-400/90 hover:bg-lime-400 text-black font-medium">
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Agent Cards */}
      <div className="p-4 border-b border-zinc-800">
        {agentsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-28 rounded-lg bg-zinc-900 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        )}
      </div>

      {/* Activity Feed */}
      <div className="flex-1 overflow-hidden">
        <ActivityFeed items={activity} isLoading={activityLoading} />
      </div>
    </div>
  );
}
