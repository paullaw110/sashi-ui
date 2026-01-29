"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickAddTaskProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddTask({ isOpen, onClose }: QuickAddTaskProps) {
  const [taskName, setTaskName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Clear task name when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTaskName("");
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: taskName.trim(),
          status: "not_started",
          priority: "medium",
        }),
      });

      if (response.ok) {
        router.refresh();
        onClose();
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-[#111] border border-[#1a1a1a] rounded-lg shadow-xl w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a]">
            <div className="flex items-center gap-2">
              <Plus size={16} className="text-[#0c0c0c] bg-[#e5e5e5] rounded p-0.5" />
              <h3 className="font-medium text-[#f5f5f5]">Quick Add Task</h3>
            </div>
            <button
              onClick={onClose}
              className="text-[#525252] hover:text-[#f5f5f5] transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-3">
              <input
                ref={inputRef}
                type="text"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                placeholder="What needs to be done?"
                className="w-full px-3 py-2 bg-[#0c0c0c] border border-[#1a1a1a] rounded-md text-[#f5f5f5] placeholder:text-[#525252] focus:outline-none focus:border-[#333] transition-colors"
                disabled={isSubmitting}
              />
              
              <div className="flex items-center justify-between text-xs text-[#525252]">
                <div>
                  Press <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] rounded font-mono">Enter</kbd> to create
                  • <kbd className="px-1.5 py-0.5 bg-[#1a1a1a] rounded font-mono">Esc</kbd> to cancel
                </div>
                {isSubmitting && (
                  <span className="text-blue-400">Creating...</span>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}