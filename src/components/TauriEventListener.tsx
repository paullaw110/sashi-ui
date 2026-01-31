"use client";

import { useEffect } from "react";

interface TauriEventListenerProps {
  onQuickAdd?: () => void;
  onOpenSettings?: () => void;
}

export function TauriEventListener({ onQuickAdd, onOpenSettings }: TauriEventListenerProps) {
  useEffect(() => {
    // Only run in Tauri environment
    if (typeof window === "undefined" || !("__TAURI__" in window)) {
      return;
    }

    const setupListeners = async () => {
      try {
        // Dynamically import Tauri event API
        const { listen } = await import("@tauri-apps/api/event");

        const unlistenQuickAdd = await listen("quick-add", () => {
          console.log("Quick add triggered from Tauri");
          onQuickAdd?.();
        });

        const unlistenSettings = await listen("open-settings", () => {
          console.log("Open settings triggered from Tauri");
          onOpenSettings?.();
        });

        return () => {
          unlistenQuickAdd();
          unlistenSettings();
        };
      } catch (error) {
        console.error("Failed to setup Tauri listeners:", error);
      }
    };

    const cleanup = setupListeners();

    return () => {
      cleanup.then((fn) => fn?.());
    };
  }, [onQuickAdd, onOpenSettings]);

  return null;
}
