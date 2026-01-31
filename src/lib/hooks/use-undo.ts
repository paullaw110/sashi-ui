"use client";

import { useCallback, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type UndoAction = {
  type: "update_task" | "delete_task" | "move_task";
  taskId: string;
  previousState: Record<string, unknown>;
  description: string;
  timestamp: number;
};

// Global undo stack (persists across hook instances)
const undoStack: UndoAction[] = [];
const MAX_UNDO_STACK = 20;

export function useUndo() {
  const queryClient = useQueryClient();
  const isUndoing = useRef(false);

  // Push an action to the undo stack
  const pushUndo = useCallback((action: Omit<UndoAction, "timestamp">) => {
    // Don't record actions during undo
    if (isUndoing.current) return;

    undoStack.push({ ...action, timestamp: Date.now() });
    
    // Trim stack if too large
    if (undoStack.length > MAX_UNDO_STACK) {
      undoStack.shift();
    }
  }, []);

  // Perform undo
  const undo = useCallback(async () => {
    const action = undoStack.pop();
    if (!action) {
      toast.info("Nothing to undo");
      return false;
    }

    isUndoing.current = true;

    try {
      if (action.type === "delete_task") {
        // Restore deleted task
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.previousState),
        });
        if (!response.ok) throw new Error("Failed to restore task");
      } else {
        // Update task with previous state
        const response = await fetch(`/api/tasks/${action.taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(action.previousState),
        });
        if (!response.ok) throw new Error("Failed to undo");
      }

      // Invalidate queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      
      toast.success(`Undone: ${action.description}`);
      return true;
    } catch (error) {
      console.error("Undo failed:", error);
      toast.error("Failed to undo");
      // Push action back to stack on failure
      undoStack.push(action);
      return false;
    } finally {
      isUndoing.current = false;
    }
  }, [queryClient]);

  // Check if undo is available
  const canUndo = useCallback(() => undoStack.length > 0, []);

  // Get last action description
  const getLastActionDescription = useCallback(() => {
    const last = undoStack[undoStack.length - 1];
    return last?.description || null;
  }, []);

  return {
    pushUndo,
    undo,
    canUndo,
    getLastActionDescription,
    isUndoing,
  };
}

// Global keyboard listener hook
export function useUndoKeyboard() {
  const { undo, canUndo } = useUndo();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+Z (Mac) or Ctrl+Z (Windows)
      if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
        // Don't intercept if user is typing in an input
        const target = e.target as HTMLElement;
        const isInput = target.tagName === "INPUT" || 
                       target.tagName === "TEXTAREA" || 
                       target.isContentEditable;
        
        if (!isInput && canUndo()) {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, canUndo]);
}
