"use client";

import { Cloud, CloudOff, RefreshCw, Check } from "lucide-react";
import { useOffline } from "./OfflineProvider";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { isOnline, isTauri, syncStatus, syncNow } = useOffline();

  // Only show in Tauri app
  if (!isTauri) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline indicator */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
          isOnline
            ? "text-green-400 bg-green-400/10"
            : "text-yellow-400 bg-yellow-400/10"
        )}
      >
        {isOnline ? (
          <>
            <Cloud size={14} />
            <span>Online</span>
          </>
        ) : (
          <>
            <CloudOff size={14} />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Pending changes indicator */}
      {syncStatus.pendingChanges > 0 && (
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-amber-400 bg-amber-400/10">
          <span>{syncStatus.pendingChanges} pending</span>
        </div>
      )}

      {/* Sync button */}
      {isOnline && (
        <button
          onClick={syncNow}
          disabled={syncStatus.isSyncing}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors",
            "text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]",
            syncStatus.isSyncing && "opacity-50 cursor-not-allowed"
          )}
          title="Sync now (Cmd+Shift+R)"
        >
          <RefreshCw
            size={14}
            className={cn(syncStatus.isSyncing && "animate-spin")}
          />
          {syncStatus.isSyncing ? "Syncing..." : "Sync"}
        </button>
      )}

      {/* Last sync time */}
      {syncStatus.lastSync && (
        <div className="flex items-center gap-1 text-xs text-[var(--text-quaternary)]">
          <Check size={12} />
          <span>
            {new Date(syncStatus.lastSync).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      )}
    </div>
  );
}
