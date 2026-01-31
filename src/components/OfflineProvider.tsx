"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";

interface SyncStatus {
  isOnline: boolean;
  pendingChanges: number;
  lastSync: string | null;
  isSyncing: boolean;
  lastSyncResult?: {
    success: boolean;
    pushed: { tasks: number; organizations: number; projects: number };
    pulled: { tasks: number; organizations: number; projects: number; tags: number };
    errors: string[];
  };
}

interface OfflineContextType {
  isOnline: boolean;
  isTauri: boolean;
  syncStatus: SyncStatus;
  syncNow: () => Promise<void>;
  runInitialSync: () => Promise<void>;
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
  runInitialSync: async () => {},
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
  
  const syncInProgressRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  // Check if we're in Tauri
  useEffect(() => {
    const inTauri = typeof window !== "undefined" && "__TAURI__" in window;
    setIsTauri(inTauri);
    
    // Store last sync time in localStorage
    if (inTauri) {
      const storedLastSync = localStorage.getItem("sashi-last-sync");
      if (storedLastSync) {
        setSyncStatus(prev => ({ ...prev, lastSync: storedLastSync }));
      }
    }
  }, []);

  // Update pending changes count periodically
  const updatePendingCount = useCallback(async () => {
    if (!isTauri) return;
    
    try {
      const { getPendingCount } = await import("@/lib/offline");
      const count = await getPendingCount();
      setSyncStatus(prev => ({ ...prev, pendingChanges: count }));
    } catch (e) {
      console.error("Failed to get pending count:", e);
    }
  }, [isTauri]);

  // Setup online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      // Auto-sync when coming back online
      if (isTauri && !syncInProgressRef.current) {
        syncNow();
      }
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
  }, [isTauri]);

  // Perform actual sync using the sync engine
  const syncNow = useCallback(async () => {
    if (!isTauri || syncInProgressRef.current) return;

    syncInProgressRef.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      // Check if we're online first
      const { invoke } = await import("@tauri-apps/api/core");
      const online = await invoke<boolean>("check_online");

      if (!online) {
        console.log("Cannot sync: offline");
        setSyncStatus(prev => ({ ...prev, isSyncing: false, isOnline: false }));
        syncInProgressRef.current = false;
        return;
      }

      // Run the real sync engine
      const { fullSync, getPendingCount } = await import("@/lib/offline");
      const result = await fullSync();
      
      const now = new Date().toISOString();
      localStorage.setItem("sashi-last-sync", now);
      
      // Update pending count after sync
      const pendingCount = await getPendingCount();

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        isOnline: true,
        lastSync: now,
        pendingChanges: pendingCount,
        lastSyncResult: {
          success: result.success,
          pushed: result.pushed,
          pulled: result.pulled,
          errors: result.errors,
        },
      }));

      if (result.success) {
        console.log(`Sync complete: pushed ${result.pushed.tasks} tasks, pulled ${result.pulled.tasks} tasks`);
      } else {
        console.error("Sync completed with errors:", result.errors);
      }
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isTauri]);

  // Initial sync: clear and pull everything fresh
  const runInitialSync = useCallback(async () => {
    if (!isTauri || syncInProgressRef.current) return;

    syncInProgressRef.current = true;
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const online = await invoke<boolean>("check_online");

      if (!online) {
        console.log("Cannot initial sync: offline");
        setSyncStatus(prev => ({ ...prev, isSyncing: false, isOnline: false }));
        syncInProgressRef.current = false;
        return;
      }

      const { initialSync } = await import("@/lib/offline");
      const result = await initialSync();
      
      const now = new Date().toISOString();
      localStorage.setItem("sashi-last-sync", now);
      initialSyncDoneRef.current = true;

      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        isOnline: true,
        lastSync: now,
        pendingChanges: 0,
        lastSyncResult: {
          success: result.success,
          pushed: result.pushed,
          pulled: result.pulled,
          errors: result.errors,
        },
      }));

      console.log(`Initial sync complete: pulled ${result.pulled.tasks} tasks`);
    } catch (error) {
      console.error("Initial sync failed:", error);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isTauri]);

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

        // Run initial sync if first time or no recent sync
        const lastSync = localStorage.getItem("sashi-last-sync");
        const oneHourAgo = Date.now() - 60 * 60 * 1000;
        
        if (!lastSync || new Date(lastSync).getTime() < oneHourAgo) {
          if (online && !initialSyncDoneRef.current) {
            // Delay initial sync slightly to let the UI load
            setTimeout(() => {
              if (!initialSyncDoneRef.current) {
                runInitialSync();
              }
            }, 2000);
          }
        } else {
          // Just update pending count
          updatePendingCount();
        }

        // Listen for online status changes
        const unlistenOnline = await listen<boolean>("online-status-changed", (event) => {
          setSyncStatus(prev => ({ ...prev, isOnline: event.payload }));
        });

        // Listen for sync-now events from menu
        const unlistenSync = await listen("sync-now", () => {
          syncNow();
        });

        // Periodic online check and pending count update (every 30 seconds)
        const interval = setInterval(async () => {
          try {
            const online = await invoke<boolean>("check_online");
            setSyncStatus(prev => ({ ...prev, isOnline: online }));
            await updatePendingCount();
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
  }, [isTauri, syncNow, runInitialSync, updatePendingCount]);

  return (
    <OfflineContext.Provider
      value={{
        isOnline: syncStatus.isOnline,
        isTauri,
        syncStatus,
        syncNow,
        runInitialSync,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
}
