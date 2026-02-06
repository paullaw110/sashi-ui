"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  mentionedAgentId: string;
  fromAgentId: string | null;
  taskId: string | null;
  commentId: string | null;
  content: string;
  delivered: boolean;
  read: boolean;
  createdAt: string;
  fromAgent: {
    id: string;
    name: string;
    avatar: string;
  } | null;
  task: {
    id: string;
    name: string;
  } | null;
}

interface NotificationsPanelProps {
  agentId?: string; // Which agent's notifications to show (default: "sashi")
  onNotificationClick?: (notification: Notification) => void;
}

export function NotificationsPanel({
  agentId = "sashi",
  onNotificationClick,
}: NotificationsPanelProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  // Fetch notifications
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications", agentId],
    queryFn: async () => {
      const res = await fetch(`/api/notifications?agentId=${agentId}`);
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Poll every 30s
  });

  // Mark as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await fetch(`/api/notifications/${notificationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ read: true }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", agentId] });
    },
  });

  // Mark all as read
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter((n) => !n.read);
      await Promise.all(
        unread.map((n) =>
          fetch(`/api/notifications/${n.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ read: true }),
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", agentId] });
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markReadMutation.mutate(notification.id);
    }
    onNotificationClick?.(notification);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-lime-400 text-[10px] font-medium text-black px-1">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-2">
          <h3 className="font-medium text-sm text-zinc-200">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-zinc-400 hover:text-zinc-200"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <CheckCheck className="w-3 h-3 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>

        {/* Notifications List */}
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center text-zinc-500 text-sm py-8">
              No notifications
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 hover:bg-zinc-800/50 transition-colors",
                    !notification.read && "bg-zinc-900"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {/* Unread indicator */}
                    <div className="pt-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full shrink-0",
                          notification.read ? "bg-transparent" : "bg-lime-400"
                        )}
                      />
                    </div>

                    {/* Avatar */}
                    <span className="text-lg shrink-0">
                      {notification.fromAgent?.avatar || "🔔"}
                    </span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-300 line-clamp-2">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {notification.task && (
                          <span className="text-xs text-zinc-500 truncate max-w-[150px]">
                            {notification.task.name}
                          </span>
                        )}
                        <span className="text-xs text-zinc-600">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Read status */}
                    {notification.read && (
                      <Check className="w-3.5 h-3.5 text-zinc-600 shrink-0 mt-1" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-zinc-800 px-3 py-2">
            <p className="text-xs text-zinc-500 text-center">
              Showing {notifications.length} notifications
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
