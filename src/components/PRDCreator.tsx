"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Loader2, Sparkles, Check, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

type Subtask = {
  name: string;
  description?: string;
};

interface PRDCreatorProps {
  taskId: string;
  taskName: string;
  existingPrd?: string | null;
  onClose: () => void;
  onPrdSaved: (prd: string) => void;
  onSubtasksCreated: (subtasks: Subtask[]) => void;
}

type Step = "context" | "waiting" | "clarify" | "review";
type PrdStatus = "none" | "analyzing" | "clarifying" | "generating" | "complete";

export function PRDCreator({
  taskId,
  taskName,
  existingPrd,
  onClose,
  onPrdSaved,
  onSubtasksCreated,
}: PRDCreatorProps) {
  const [step, setStep] = useState<Step>(existingPrd ? "review" : "context");
  const [context, setContext] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clarification step
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  // Review step
  const [prd, setPrd] = useState(existingPrd || "");
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<Subtask[]>([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<number>>(new Set());
  const [isCreatingSubtasks, setIsCreatingSubtasks] = useState(false);

  // Poll for PRD status updates from Sashi
  const pollStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/generate-prd`);
      if (!res.ok) return;
      
      const data = await res.json();
      const status = data.status as PrdStatus;
      
      if (status === "clarifying" && data.questions?.length > 0) {
        // Sashi has analyzed and provided questions
        setSummary(data.summary || "");
        setQuestions(data.questions);
        setStep("clarify");
        setIsPolling(false);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      } else if (status === "complete" && data.prd) {
        // Sashi has generated the full PRD
        setPrd(data.prd);
        setStep("review");
        setIsPolling(false);
        onPrdSaved(data.prd);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error polling PRD status:", error);
    }
  }, [taskId, onPrdSaved]);

  // Start polling when in waiting state
  useEffect(() => {
    if (step === "waiting" && !pollIntervalRef.current) {
      setIsPolling(true);
      // Poll every 3 seconds
      pollIntervalRef.current = setInterval(pollStatus, 3000);
      // Also poll immediately
      pollStatus();
    }
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [step, pollStatus]);

  // Step 1: Submit context for analysis
  const handleAnalyze = useCallback(async () => {
    if (!context.trim()) return;
    
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/generate-prd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      
      if (!res.ok) throw new Error("Failed to analyze");
      
      // Move to waiting state - Sashi will process async
      setStep("waiting");
      toast.success("Context sent to Sashi for analysis");
    } catch (error) {
      toast.error("Failed to send context");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, context]);

  // Step 2: Submit answers
  const handleSubmitAnswers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/generate-prd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      
      if (!res.ok) throw new Error("Failed to submit answers");
      
      // Move to waiting state for PRD generation
      setStep("waiting");
      toast.success("Answers sent. Sashi is generating the PRD.");
    } catch (error) {
      toast.error("Failed to submit answers");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, answers]);

  // Create selected subtasks
  const handleCreateSubtasks = useCallback(async () => {
    const subtasksToCreate = suggestedSubtasks.filter((_, i) => selectedSubtasks.has(i));
    if (subtasksToCreate.length === 0) {
      toast.error("Select at least one subtask");
      return;
    }
    
    setIsCreatingSubtasks(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subtasks: subtasksToCreate }),
      });
      
      if (!res.ok) throw new Error("Failed to create subtasks");
      
      const data = await res.json();
      toast.success(`Created ${data.created.length} subtasks`);
      onSubtasksCreated(data.created);
      onClose();
    } catch (error) {
      toast.error("Failed to create subtasks");
    } finally {
      setIsCreatingSubtasks(false);
    }
  }, [taskId, suggestedSubtasks, selectedSubtasks, onSubtasksCreated, onClose]);

  const toggleSubtask = (index: number) => {
    setSelectedSubtasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const updateAnswer = (question: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [question]: answer }));
  };

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <span className={cn((step === "context" || step === "waiting") && "text-[var(--accent-primary)] font-medium")}>
          1. Context
        </span>
        <ChevronRight size={12} />
        <span className={cn(step === "clarify" && "text-[var(--accent-primary)] font-medium")}>
          2. Clarify
        </span>
        <ChevronRight size={12} />
        <span className={cn(step === "review" && "text-[var(--accent-primary)] font-medium")}>
          3. Review
        </span>
      </div>

      {/* Step 1: Context */}
      {step === "context" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Dump your context
            </h3>
            <p className="text-xs text-[var(--text-tertiary)] mb-3">
              Write everything you know about this task. I'll analyze it and ask clarifying questions.
            </p>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe the feature, problem, requirements, constraints, anything relevant..."
              className="min-h-[200px] resize-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleAnalyze} disabled={!context.trim() || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-2" />
                  Analyze
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Waiting state - polling for Sashi's response */}
      {step === "waiting" && (
        <div className="space-y-4">
          <Card className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-[var(--accent-primary)]/10 flex items-center justify-center">
                  <RefreshCw size={24} className="text-[var(--accent-primary)] animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[var(--text-primary)] mb-1">
                  Sashi is analyzing...
                </h3>
                <p className="text-xs text-[var(--text-tertiary)]">
                  I'm reviewing your context and preparing clarifying questions.
                  <br />
                  This usually takes 10-30 seconds.
                </p>
              </div>
              {isPolling && (
                <p className="text-[10px] text-[var(--text-quaternary)]">
                  Checking for updates...
                </p>
              )}
            </div>
          </Card>
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Clarify */}
      {step === "clarify" && (
        <div className="space-y-4">
          {summary && (
            <Card className="p-4 bg-[var(--bg-surface)]">
              <p className="text-sm text-[var(--text-secondary)]">
                <strong>I understood:</strong> {summary}
              </p>
            </Card>
          )}
          
          {questions.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                Clarifying questions
              </h3>
              {questions.map((q, i) => (
                <Card key={i} className="p-4 space-y-2">
                  <p className="text-sm text-[var(--text-primary)] font-medium">
                    {i + 1}. {q}
                  </p>
                  <Textarea
                    value={answers[q] || ""}
                    onChange={(e) => updateAnswer(q, e.target.value)}
                    placeholder="Your answer..."
                    className="min-h-[80px] resize-none text-sm"
                  />
                </Card>
              ))}
              <p className="text-xs text-[var(--text-quaternary)]">
                You can skip questions you're unsure about.
              </p>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("context")}>
              ← Back
            </Button>
            <Button onClick={handleSubmitAnswers} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="mr-2" />
                  Generate PRD
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === "review" && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Generated PRD
            </h3>
            <Card className="p-4 max-h-[300px] overflow-y-auto">
              <article className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{prd}</ReactMarkdown>
              </article>
            </Card>
          </div>
          
          {suggestedSubtasks.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Suggested subtasks
              </h3>
              <Card className="divide-y divide-[var(--border-default)]">
                {suggestedSubtasks.map((subtask, i) => (
                  <button
                    key={i}
                    onClick={() => toggleSubtask(i)}
                    className={cn(
                      "w-full text-left p-3 flex items-start gap-3 transition-colors hover:bg-[var(--bg-surface)]",
                      selectedSubtasks.has(i) && "bg-[var(--bg-surface)]"
                    )}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5",
                        selectedSubtasks.has(i)
                          ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-black"
                          : "border-[var(--border-strong)]"
                      )}
                    >
                      {selectedSubtasks.has(i) && <Check size={12} />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {subtask.name}
                      </p>
                      {subtask.description && (
                        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                          {subtask.description}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </Card>
            </div>
          )}
          
          <div className="flex justify-between">
            <Button variant="ghost" onClick={onClose}>
              Done
            </Button>
            {suggestedSubtasks.length > 0 && (
              <Button onClick={handleCreateSubtasks} disabled={isCreatingSubtasks || selectedSubtasks.size === 0}>
                {isCreatingSubtasks ? (
                  <>
                    <Loader2 size={14} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={14} className="mr-2" />
                    Create {selectedSubtasks.size} Subtask{selectedSubtasks.size !== 1 && "s"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
