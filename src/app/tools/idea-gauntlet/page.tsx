"use client";

import { useState, useEffect } from "react";
import { Skull, Loader2, Download, RotateCcw, Plus, ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";

interface GauntletResult {
  clarityCheck: {
    oneLiner: string;
    problem: string;
    solution: string;
    score: number;
  };
  killShots: string[];
  marketReality: {
    existingAlternatives: string[];
    whoPaysTodayFor: string;
    marketSize: string;
    difficulty: string;
  };
  yourEdge: {
    whyYou: string;
    whyNow: string;
    unfairAdvantage: string;
    moatPotential: string;
  };
  verdict: {
    decision: "GO" | "PAUSE" | "KILL";
    confidence: number;
    reasoning: string;
    nextSteps: string[];
  };
}

interface HistoryRun {
  id: string;
  idea: string;
  verdict: "GO" | "PAUSE" | "KILL";
  confidence: number;
  createdAt: number;
}

type View = "history" | "new" | "detail";

export default function IdeaGauntletPage() {
  const [view, setView] = useState<View>("history");
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  
  // New idea state
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GauntletResult | null>(null);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Detail view state
  const [selectedRun, setSelectedRun] = useState<{ id: string; idea: string; result: GauntletResult } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Fetch history on mount
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/tools/idea-gauntlet");
      if (response.ok) {
        const data = await response.json();
        setHistory(data.runs || []);
      }
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const runGauntlet = async (ideaText?: string) => {
    const textToAnalyze = ideaText || idea;
    if (!textToAnalyze.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tools/idea-gauntlet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: textToAnalyze }),
      });

      if (!response.ok) {
        throw new Error("Failed to run gauntlet");
      }

      const data = await response.json();
      setResult(data);
      setCurrentRunId(data.id);
      if (!ideaText) {
        setIdea(textToAnalyze);
      }
      // Refresh history
      fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const viewDetail = async (run: HistoryRun) => {
    setLoadingDetail(true);
    setView("detail");
    
    try {
      const response = await fetch(`/api/tools/idea-gauntlet/${run.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedRun({
          id: data.id,
          idea: data.idea,
          result: data.result,
        });
      }
    } catch (err) {
      console.error("Failed to fetch run details:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const deleteRun = async (id: string) => {
    if (!confirm("Delete this idea? This can't be undone.")) return;
    
    setDeleting(true);
    try {
      await fetch(`/api/tools/idea-gauntlet/${id}`, { method: "DELETE" });
      await fetchHistory();
      setView("history");
      setSelectedRun(null);
    } catch (err) {
      console.error("Failed to delete:", err);
    } finally {
      setDeleting(false);
    }
  };

  const rerunIdea = async () => {
    if (!selectedRun) return;
    setView("new");
    setIdea(selectedRun.idea);
    await runGauntlet(selectedRun.idea);
  };

  const exportMarkdown = (ideaText: string, resultData: GauntletResult) => {
    const md = `# Idea Gauntlet Results

## The Idea
${ideaText}

---

## 1. Clarity Check (Score: ${resultData.clarityCheck.score}/10)

**One-liner:** ${resultData.clarityCheck.oneLiner}

**Problem:** ${resultData.clarityCheck.problem}

**Solution:** ${resultData.clarityCheck.solution}

---

## 2. Kill Shots 💀

${resultData.killShots.map((shot, i) => `${i + 1}. ${shot}`).join("\n")}

---

## 3. Market Reality

**Who pays for this today?** ${resultData.marketReality.whoPaysTodayFor}

**Existing alternatives:**
${resultData.marketReality.existingAlternatives.map(alt => `- ${alt}`).join("\n")}

**Market size:** ${resultData.marketReality.marketSize}

**Difficulty:** ${resultData.marketReality.difficulty}

---

## 4. Your Edge

**Why you?** ${resultData.yourEdge.whyYou}

**Why now?** ${resultData.yourEdge.whyNow}

**Unfair advantage:** ${resultData.yourEdge.unfairAdvantage}

**Moat potential:** ${resultData.yourEdge.moatPotential}

---

## 5. Verdict: ${resultData.verdict.decision}

**Confidence:** ${resultData.verdict.confidence}%

**Reasoning:** ${resultData.verdict.reasoning}

**Next steps:**
${resultData.verdict.nextSteps.map(step => `- ${step}`).join("\n")}

---
*Generated by Idea Gauntlet*
`;

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "idea-gauntlet-results.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetToNew = () => {
    setIdea("");
    setResult(null);
    setCurrentRunId(null);
    setError(null);
  };

  const goBackToHistory = () => {
    setView("history");
    setSelectedRun(null);
    resetToNew();
  };

  const verdictColors = {
    GO: "text-green-400 bg-green-500/10 border-green-500/30",
    PAUSE: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    KILL: "text-red-400 bg-red-500/10 border-red-500/30",
  };

  const verdictBadge = {
    GO: { icon: "🟢", label: "GO" },
    PAUSE: { icon: "🟡", label: "PAUSE" },
    KILL: { icon: "💀", label: "KILL" },
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // ===== HISTORY VIEW =====
  if (view === "history") {
    return (
      <AppLayout 
        title="Idea Gauntlet" 
        subtitle="Stress test your ideas. No sugarcoating."
      >
        <div className="max-w-4xl">
          {/* Header with New Idea button */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={() => { resetToNew(); setView("new"); }}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-[#0D0D0D] rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Idea
            </button>
          </div>

          {loadingHistory ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : history.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="text-5xl mb-4">💀</div>
              <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                No ideas tested yet
              </h2>
              <p className="text-[var(--text-tertiary)] mb-6">
                Your graveyard (and victories) will appear here
              </p>
              <button
                onClick={() => { resetToNew(); setView("new"); }}
                className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-[#0D0D0D] rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                <Skull className="w-5 h-5" />
                Test Your First Idea
              </button>
            </div>
          ) : (
            // History list
            <div className="space-y-3">
              {history.map((run) => (
                <button
                  key={run.id}
                  onClick={() => viewDetail(run)}
                  className="w-full p-4 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-left hover:bg-[var(--bg-hover)] transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`px-2 py-1 rounded text-xs font-medium border ${verdictColors[run.verdict]}`}>
                      {verdictBadge[run.verdict].icon} {verdictBadge[run.verdict].label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {run.idea}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-[var(--text-quaternary)]">
                          {formatDate(run.createdAt)}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)]">
                          · {run.confidence}% confidence
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ===== DETAIL VIEW =====
  if (view === "detail") {
    return (
      <AppLayout 
        title="Idea Gauntlet" 
        subtitle="Stress test your ideas. No sugarcoating."
      >
        <div className="max-w-4xl">
          {/* Back button and actions */}
          <div className="flex justify-between items-center mb-6">
            <button
              onClick={goBackToHistory}
              className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to History
            </button>
            
            {selectedRun && (
              <div className="flex items-center gap-2">
                <button
                  onClick={rerunIdea}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-hover)] rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Re-run
                </button>
                <button
                  onClick={() => deleteRun(selectedRun.id)}
                  disabled={deleting}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            )}
          </div>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : selectedRun ? (
            <ResultsView 
              idea={selectedRun.idea} 
              result={selectedRun.result} 
              onExport={() => exportMarkdown(selectedRun.idea, selectedRun.result)}
            />
          ) : (
            <div className="text-center py-20 text-[var(--text-tertiary)]">
              Failed to load results
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  // ===== NEW IDEA VIEW =====
  return (
    <AppLayout 
      title="Idea Gauntlet" 
      subtitle="Stress test your idea. No sugarcoating."
    >
      <div className="max-w-4xl">
        {/* Back to history */}
        <button
          onClick={goBackToHistory}
          className="flex items-center gap-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </button>

        {!result ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm text-[var(--text-tertiary)] mb-2">
                Describe your idea in 2-3 sentences
              </label>
              <textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="e.g., A subscription service that sends personalized vitamin packs based on your health data and goals..."
                className="w-full h-40 px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[var(--accent-primary)] resize-none"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
                {error}
              </div>
            )}

            <button
              onClick={() => runGauntlet()}
              disabled={!idea.trim() || loading}
              className="flex items-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-[#0D0D0D] rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Running Gauntlet...
                </>
              ) : (
                <>
                  <Skull className="w-5 h-5" />
                  Run the Gauntlet
                </>
              )}
            </button>
          </div>
        ) : (
          <>
            <ResultsView 
              idea={idea} 
              result={result} 
              onExport={() => exportMarkdown(idea, result)}
            />
            
            {/* Actions */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => exportMarkdown(idea, result)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Markdown
              </button>
              <button
                onClick={resetToNew}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-elevated)] transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Test Another Idea
              </button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

// ===== RESULTS COMPONENT =====
function ResultsView({ 
  idea, 
  result, 
  onExport 
}: { 
  idea: string; 
  result: GauntletResult; 
  onExport: () => void;
}) {
  const verdictColors = {
    GO: "text-green-400 bg-green-400/10 border-green-400/30",
    PAUSE: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
    KILL: "text-red-400 bg-red-400/10 border-red-400/30",
  };

  return (
    <div className="space-y-8">
      {/* Original idea */}
      <div className="p-4 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
        <div className="text-xs text-[var(--text-quaternary)] uppercase tracking-wider mb-2">Your Idea</div>
        <p className="text-[var(--text-secondary)]">{idea}</p>
      </div>

      {/* Clarity Check */}
      <Section title="1. Clarity Check" score={result.clarityCheck.score}>
        <div className="space-y-4">
          <Field label="One-liner" value={result.clarityCheck.oneLiner} />
          <Field label="Problem" value={result.clarityCheck.problem} />
          <Field label="Solution" value={result.clarityCheck.solution} />
        </div>
      </Section>

      {/* Kill Shots */}
      <Section title="2. Kill Shots" icon="💀">
        <ol className="list-decimal list-inside space-y-2">
          {result.killShots.map((shot, i) => (
            <li key={i} className="text-[var(--text-secondary)]">{shot}</li>
          ))}
        </ol>
      </Section>

      {/* Market Reality */}
      <Section title="3. Market Reality">
        <div className="space-y-4">
          <Field label="Who pays for this today?" value={result.marketReality.whoPaysTodayFor} />
          <div>
            <div className="text-xs text-[var(--text-quaternary)] uppercase tracking-wider mb-2">Existing Alternatives</div>
            <ul className="list-disc list-inside space-y-1">
              {result.marketReality.existingAlternatives.map((alt, i) => (
                <li key={i} className="text-[var(--text-secondary)]">{alt}</li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Market Size" value={result.marketReality.marketSize} />
            <Field label="Difficulty" value={result.marketReality.difficulty} />
          </div>
        </div>
      </Section>

      {/* Your Edge */}
      <Section title="4. Your Edge">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Why you?" value={result.yourEdge.whyYou} />
            <Field label="Why now?" value={result.yourEdge.whyNow} />
          </div>
          <Field label="Unfair advantage" value={result.yourEdge.unfairAdvantage} />
          <Field label="Moat potential" value={result.yourEdge.moatPotential} />
        </div>
      </Section>

      {/* Verdict */}
      <div className={`p-6 rounded-lg border ${verdictColors[result.verdict.decision]}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">{result.verdict.decision}</div>
          <div className="text-sm opacity-80">{result.verdict.confidence}% confidence</div>
        </div>
        <p className="mb-4">{result.verdict.reasoning}</p>
        <div>
          <div className="text-xs uppercase tracking-wider mb-2 opacity-60">Next Steps</div>
          <ul className="list-disc list-inside space-y-1">
            {result.verdict.nextSteps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, score, icon }: { title: string; children: React.ReactNode; score?: number; icon?: string }) {
  return (
    <div className="p-6 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          {title} {icon && <span>{icon}</span>}
        </h2>
        {score !== undefined && (
          <div className="text-sm text-[var(--text-tertiary)]">Score: {score}/10</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-[var(--text-quaternary)] uppercase tracking-wider mb-1">{label}</div>
      <p className="text-[var(--text-secondary)]">{value}</p>
    </div>
  );
}
