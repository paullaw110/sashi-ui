"use client";

import { useUndoKeyboard } from "@/lib/hooks/use-undo";

export function UndoProvider({ children }: { children: React.ReactNode }) {
  // Register global Cmd+Z listener
  useUndoKeyboard();
  
  return <>{children}</>;
}
