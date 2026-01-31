"use client";

import { useState } from "react";
import { Cloud, CloudOff, RefreshCw, Check, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useOffline } from "./OfflineProvider";
import { cn } from "@/lib/utils";

export function SyncIndicator() {
  const { isOnline, isTauri, syncStatus, syncNow } = useOffline();
  const [showDetails, setShowDetails] = useState(false);

  // Only show in Tauri app
  if (!isTauri) return null;

  const lastResult = syncStatus.lastSyncResult;
  const hasErrors = lastResult && lastResult.errors.length > 0;

  return (
    <div className="relative">
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

        {/* Error indicator */}
        {hasErrors && !syncStatus.isSyncing && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md text-xs text-red-400 bg-red-400/10">
            <AlertCircle size={12} />
            <span>{lastResult.errors.length}</span>
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

        {/* Last sync time with toggle for details */}
        {syncStatus.lastSync && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-xs text-[var(--text-quaternary)] hover:text-[var(--text-tertiary)] transition-colors"
          >
            <Check size={12} className={cn(hasErrors && "text-yellow-400")} />
            <span>
              {new Date(syncStatus.lastSync).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        )}
      </div>

      {/* Sync details dropdown */}
      {showDetails && lastResult && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-lg p-3 z-50">
          <div className="text-xs space-y-2">
            <div className="font-medium text-[var(--text-primary)] mb-2">Last Sync Details</div>
            
            {/* Pushed */}
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Pushed:</span>
              <span className="text-[var(--text-primary)]">
                {lastResult.pushed.tasks} tasks, {lastResult.pushed.organizations} orgs
              </span>
            </div>
            
            {/* Pulled */}
            <div className="flex justify-between text-[var(--text-secondary)]">
              <span>Pulled:</span>
              <span className="text-[var(--text-primary)]">
                {lastResult.pulled.tasks} tasks, {lastResult.pulled.organizations} orgs
              </span>
            </div>

            {/* Errors */}
            {lastResult.errors.length > 0 && (
              <div className="mt-2 pt-2 border-t border-[var(--border-default)]">
                <div className="text-red-400 font-medium mb-1">Errors:</div>
                <ul className="text-red-300 space-y-1">
                  {lastResult.errors.slice(0, 3).map((err, i) => (
                    <li key={i} className="truncate" title={err}>
                      {err.slice(0, 40)}...
                    </li>
                  ))}
                  {lastResult.errors.length > 3 && (
                    <li className="text-[var(--text-quaternary)]">
                      +{lastResult.errors.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Success message */}
            {lastResult.errors.length === 0 && (
              <div className="flex items-center gap-1 text-green-400 mt-2 pt-2 border-t border-[var(--border-default)]">
                <Check size={12} />
                <span>Sync completed successfully</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
