"use client";

import { formatDistanceToNow, isToday, isYesterday, isThisWeek, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  CheckCircle2,
  PlusCircle,
  ArrowRight,
  UserPlus,
  RefreshCw,
} from "lucide-react";

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

interface ActivityFeedProps {
  items: ActivityItem[];
  isLoading: boolean;
}

type GroupedActivity = {
  label: string;
  items: ActivityItem[];
};

function groupByTime(items: ActivityItem[]): GroupedActivity[] {
  const groups: { [key: string]: ActivityItem[] } = {};

  items.forEach((item) => {
    const date = new Date(item.createdAt);
    let label: string;

    if (isToday(date)) {
      label = "Today";
    } else if (isYesterday(date)) {
      label = "Yesterday";
    } else if (isThisWeek(date)) {
      label = "This Week";
    } else {
      label = format(date, "MMMM d");
    }

    if (!groups[label]) {
      groups[label] = [];
    }
    groups[label].push(item);
  });

  // Maintain order: Today, Yesterday, This Week, then older dates
  const order = ["Today", "Yesterday", "This Week"];
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return 0;
  });

  return sortedKeys.map((label) => ({
    label,
    items: groups[label],
  }));
}

function getActivityIcon(type: string) {
  switch (type) {
    case "task_created":
      return PlusCircle;
    case "task_completed":
      return CheckCircle2;
    case "comment_added":
      return MessageSquare;
    case "task_assigned":
      return ArrowRight;
    case "agent_created":
      return UserPlus;
    case "status_changed":
      return RefreshCw;
    default:
      return RefreshCw;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "task_created":
      return "text-lime-400";
    case "task_completed":
      return "text-green-400";
    case "comment_added":
      return "text-blue-400";
    case "task_assigned":
      return "text-purple-400";
    case "agent_created":
      return "text-amber-400";
    default:
      return "text-zinc-400";
  }
}

function ActivityItemRow({ item }: { item: ActivityItem }) {
  const Icon = getActivityIcon(item.type);
  const iconColor = getActivityColor(item.type);
  const timeAgo = formatDistanceToNow(new Date(item.createdAt), { addSuffix: true });

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-900/30 transition-colors cursor-pointer group">
      {/* Agent avatar */}
      <div className="text-lg mt-0.5">
        {item.agent?.avatar || "🤖"}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-zinc-300">
          <span className="font-medium text-zinc-100">{item.agent?.name || "System"}</span>{" "}
          {item.message.replace(`${item.agent?.name || ""} `, "")}
        </p>
        {item.task && (
          <p className="text-xs text-zinc-500 mt-0.5 truncate">
            → {item.task.name}
          </p>
        )}
      </div>

      {/* Time and icon */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs text-zinc-600 group-hover:text-zinc-500 transition-colors">
          {timeAgo}
        </span>
        <Icon className={cn("w-4 h-4", iconColor)} />
      </div>
    </div>
  );
}

export function ActivityFeed({ items, isLoading }: ActivityFeedProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-400">Activity Feed</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3">
              <div className="w-7 h-7 rounded-full bg-zinc-800 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-zinc-800 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const groupedItems = groupByTime(items);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-400">Activity Feed</h2>
        <span className="text-xs text-zinc-600">{items.length} events</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {groupedItems.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-zinc-600">No activity yet</p>
          </div>
        ) : (
          groupedItems.map((group) => (
            <div key={group.label}>
              <div className="sticky top-0 bg-zinc-950/80 backdrop-blur-sm px-4 py-2 border-b border-zinc-800/50">
                <span className="text-xs font-medium text-zinc-500">{group.label}</span>
              </div>
              {group.items.map((item) => (
                <ActivityItemRow key={item.id} item={item} />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
