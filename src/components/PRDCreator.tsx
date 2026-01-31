"use client";

import { useState, useCallback } from "react";
import { Loader2, Sparkles, Check, ChevronRight, Plus } from "lucide-react";
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

type Step = "context" | "clarify" | "review";

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
  
  // Clarification step
  const [summary, setSummary] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState("");
  
  // Review step
  const [prd, setPrd] = useState(existingPrd || "");
  const [suggestedSubtasks, setSuggestedSubtasks] = useState<Subtask[]>([]);
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<number>>(new Set());
  const [isCreatingSubtasks, setIsCreatingSubtasks] = useState(false);

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
      
      const data = await res.json();
      setSummary(data.summary || "");
      setQuestions(data.questions || []);
      setStep("clarify");
    } catch (error) {
      toast.error("Failed to analyze context");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, context]);

  // Step 2: Submit answers and generate PRD
  const handleGeneratePrd = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/finalize-prd`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      
      if (!res.ok) throw new Error("Failed to generate PRD");
      
      const data = await res.json();
      setPrd(data.prd || "");
      setSuggestedSubtasks(data.suggestedSubtasks || []);
      // Select all subtasks by default
      setSelectedSubtasks(new Set(data.suggestedSubtasks?.map((_: unknown, i: number) => i) || []));
      setStep("review");
      onPrdSaved(data.prd || "");
    } catch (error) {
      toast.error("Failed to generate PRD");
    } finally {
      setIsLoading(false);
    }
  }, [taskId, answers, onPrdSaved]);

  // Step 3: Create selected subtasks
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

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 text-xs text-[var(--text-tertiary)]">
        <span className={cn(step === "context" && "text-[var(--accent-primary)] font-medium")}>
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
                  Analyzing...
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
            <div>
              <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                Clarifying questions
              </h3>
              <Card className="p-4 space-y-2">
                {questions.map((q, i) => (
                  <p key={i} className="text-sm text-[var(--text-primary)]">
                    {i + 1}. {q}
                  </p>
                ))}
              </Card>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
              Your answers
            </h3>
            <Textarea
              value={answers}
              onChange={(e) => setAnswers(e.target.value)}
              placeholder="Answer the questions above, add any additional context..."
              className="min-h-[120px] resize-none"
              autoFocus
            />
            <p className="text-xs text-[var(--text-quaternary)] mt-1">
              You can skip questions you're unsure about.
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep("context")}>
              ← Back
            </Button>
            <Button onClick={handleGeneratePrd} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={14} className="mr-2 animate-spin" />
                  Generating...
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
