"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

interface SyncStatus {
  isOnline: boolean;
  pendingChanges: number;
  lastSync: string | null;
  isSyncing: boolean;
}

interface OfflineContextType {
  isOnline: boolean;
  isTauri: boolean;
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  isTauri: false,
  syncStatus: {
    isOnline: true,
    pendingChanges: 0,
    lastSync: null,
    isSyncing: false,
  },
  syncNow: async () => {},
});

export function useOffline() {
  return useContext(OfflineContext);
}

interface OfflineProviderProps {
  children: ReactNode;
}

export function OfflineProvider({ children }: OfflineProviderProps) {
  const [isTauri, setIsTauri] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingChanges: 0,
    lastSync: null,
    isSyncing: false,
  });

  // Check if we're in Tauri
  useEffect(() => {
    setIsTauri(typeof window !== "undefined" && "__TAURI__" in window);
  }, []);

  // Setup online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    // Browser online/offline events
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial check
    setSyncStatus(prev => ({ ...prev, isOnline: navigator.onLine }));

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Listen for Tauri sync events
  useEffect(() => {
    if (!isTauri) return;

    const setupListeners = async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const { invoke } = await import("@tauri-apps/api/core");

        // Check initial online status
        const online = await invoke<boolean>("check_online");
        setSyncStatus(prev => ({ ...prev, isOnline: online }));

        // Listen for online status changes
        const unlistenOnline = await listen<boolean>("online-status-changed", (event) => {
          setSyncStatus(prev => ({ ...prev, isOnline: event.payload }));
        });

        // Listen for sync-now events from menu
        const unlistenSync = await listen("sync-now", () => {
          syncNow();
        });

        // Periodic online check (every 30 seconds)
        const interval = setInterval(async () => {
          try {
            const online = await invoke<boolean>("check_online");
            setSyncStatus(prev => ({ ...prev, isOnline: online }));
          } catch (e) {
            console.error("Failed to check online status:", e);
          }
        }, 30000);

        return () => {
          unlistenOnline();
          unlistenSync();
          clearInterval(interval);
        };
      } catch (error) {
        console.error("Failed to setup Tauri offline listeners:", error);
      }
    };

    const cleanup = setupListeners();
    return () => {
      cleanup.then(fn => fn?.());
    };
  }, [isTauri]);

  const syncNow = useCallback(async () => {
    if (!isTauri || syncStatus.isSyncing) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Check if we're online first
      const { invoke } = await import("@tauri-apps/api/core");
      const online = await invoke<boolean>("check_online");

      if (!online) {
        console.log("Cannot sync: offline");
        setSyncStatus(prev => ({ ...prev, isSyncing: false, isOnline: false }));
        return;
      }

      // For now, just reload the page to get fresh data
      // In a full implementation, this would:
      // 1. Push local dirty changes to server
      // 2. Pull server changes
      // 3. Resolve conflicts
      window.location.reload();

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        isOnline: true,
        lastSync: new Date().toISOString(),
        pendingChanges: 0,
      }));
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [isTauri, syncStatus.isSyncing]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: syncStatus.isOnline,
        isTauri,
        syncStatus,
        syncNow,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
