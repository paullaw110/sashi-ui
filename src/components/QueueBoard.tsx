"use client";

import { useMemo } from "react";
import { Circle, Play, CheckCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type QueueItem = {
  id: string;
  task: string;
  status: string;
  sessionKey: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
};

interface QueueBoardProps {
  items: QueueItem[];
}

const COLUMNS = [
  { id: "queued", title: "Queued", icon: Circle },
  { id: "in_progress", title: "In Progress", icon: Play },
  { id: "blocked", title: "Blocked", icon: AlertCircle },
  { id: "done", title: "Done", icon: CheckCircle },
];

export function QueueBoard({ items }: QueueBoardProps) {
  const itemsByStatus = useMemo(() => {
    const map: Record<string, QueueItem[]> = {};
    COLUMNS.forEach(col => map[col.id] = []);
    items.forEach(item => {
      if (map[item.status]) {
        map[item.status].push(item);
      } else {
        map["queued"].push(item);
      }
    });
    return map;
  }, [items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {COLUMNS.map((column) => {
        const Icon = column.icon;
        const columnItems = itemsByStatus[column.id] || [];
        
        return (
          <div
            key={column.id}
            className="bg-[#111] rounded-lg border border-[#1a1a1a] p-4"
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 mb-4">
              <Icon size={14} className="text-[#404040]" strokeWidth={1.5} />
              <h3 className="text-xs text-[#737373]">{column.title}</h3>
              <span className="text-[10px] text-[#333] ml-auto">
                {columnItems.length}
              </span>
            </div>

            {/* Items */}
            <div className="space-y-2">
              {columnItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#161616] border border-[#1a1a1a] rounded p-3 hover:border-[#222] transition-colors"
                >
                  <p className="text-xs text-[#a3a3a3]">{item.task}</p>
                  <span className="text-[9px] text-[#333] mt-2 block">
                    {item.startedAt 
                      ? `Started ${formatDistanceToNow(new Date(item.startedAt), { addSuffix: true })}`
                      : `Added ${formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}`
                    }
                  </span>
                </div>
              ))}

              {columnItems.length === 0 && (
                <div className="text-center py-6 text-[#222] text-[10px]">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
