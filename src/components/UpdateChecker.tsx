"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function UpdateChecker() {
  const [isTauri, setIsTauri] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<{
    version: string;
    notes?: string;
  } | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const inTauri = typeof window !== "undefined" && "__TAURI__" in window;
    setIsTauri(inTauri);

    if (inTauri) {
      checkForUpdates();
    }
  }, []);

  const checkForUpdates = async () => {
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (update?.available) {
        setUpdateAvailable(true);
        setUpdateInfo({
          version: update.version,
          notes: update.body ?? undefined,
        });
      }
    } catch (error) {
      console.log("Update check failed:", error);
      // Silently fail - user doesn't need to know
    }
  };

  const downloadAndInstall = async () => {
    if (!updateInfo) return;

    setIsDownloading(true);
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();

      if (update?.available) {
        // Download and install
        await update.downloadAndInstall();

        // Relaunch the app
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }
    } catch (error) {
      console.error("Update failed:", error);
      setIsDownloading(false);
    }
  };

  if (!isTauri || !updateAvailable || dismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <div className="bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-[var(--accent)]/10 rounded-lg">
            <Download size={20} className="text-[var(--accent)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium text-[var(--text-primary)]">
                Update Available
              </h3>
              <button
                onClick={() => setDismissed(true)}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Version {updateInfo?.version} is ready to install.
            </p>
            {updateInfo?.notes && (
              <p className="text-xs text-[var(--text-tertiary)] mt-2 line-clamp-2">
                {updateInfo.notes}
              </p>
            )}
            <button
              onClick={downloadAndInstall}
              disabled={isDownloading}
              className={cn(
                "mt-3 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                "bg-[var(--accent)] text-[var(--bg-base)]",
                "hover:bg-[var(--accent-hover)]",
                isDownloading && "opacity-50 cursor-not-allowed"
              )}
            >
              {isDownloading ? "Downloading..." : "Install Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
