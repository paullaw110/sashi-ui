"use client";

import { useState, useCallback } from "react";
import { 
  Check, 
  ChevronRight, 
  Building2, 
  Search, 
  Users, 
  Package, 
  Target, 
  FileText, 
  Palette, 
  FileCode,
  Sparkles,
  Loader2,
  Download,
  Save,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PHASES = [
  { id: 1, name: "Project Setup", icon: Building2, description: "Basic project info" },
  { id: 2, name: "Industry Research", icon: Search, description: "Market analysis" },
  { id: 3, name: "Buyer Persona", icon: Users, description: "Target customer" },
  { id: 4, name: "Offer Definition", icon: Package, description: "What you sell" },
  { id: 5, name: "Positioning", icon: Target, description: "Market position" },
  { id: 6, name: "Copy Generation", icon: FileText, description: "Website copy" },
  { id: 7, name: "Design Direction", icon: Palette, description: "Visual style" },
  { id: 8, name: "Build Brief", icon: FileCode, description: "Final output" },
];

interface BriefWizardProps {
  brief?: any;
  onSave: (data: any) => Promise<any>;
}

export function BriefWizard({ brief, onSave }: BriefWizardProps) {
  const [currentPhase, setCurrentPhase] = useState(brief?.currentPhase || 1);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  const [formData, setFormData] = useState({
    name: brief?.name || "",
    projectSetup: brief?.projectSetup ? JSON.parse(brief.projectSetup) : {
      businessName: "", industry: "", location: "", websiteUrl: "", projectType: "new",
    },
    industryResearch: brief?.industryResearch ? JSON.parse(brief.industryResearch) : {
      overview: "", painPoints: "", triggers: "", trustSignals: "", competitors: "",
    },
    buyerPersona: brief?.buyerPersona ? JSON.parse(brief.buyerPersona) : {
      demographics: "", psychographics: "", goals: "", fears: "", decisionFactors: "",
    },
    offerDefinition: brief?.offerDefinition ? JSON.parse(brief.offerDefinition) : {
      coreService: "", pricing: "", differentiators: "", guarantee: "", primaryCta: "",
    },
    positioning: brief?.positioning ? JSON.parse(brief.positioning) : {
      advantages: "", uniqueSellingPoints: "", positioningStatement: "", onlyWe: "",
    },
    copyGeneration: brief?.copyGeneration ? JSON.parse(brief.copyGeneration) : {
      heroHeadline: "", heroSubhead: "", problemStatement: "", solutionStatement: "",
      benefits: "", socialProof: "", faq: "", ctaVariations: "",
    },
    designDirection: brief?.designDirection ? JSON.parse(brief.designDirection) : {
      style: "modern", colorPalette: "", typography: "", references: "", moodKeywords: "",
    },
    buildBrief: brief?.buildBrief || "",
  });

  const updateField = useCallback((phase: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [phase]: { ...prev[phase as keyof typeof prev], [field]: value },
    }));
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await onSave({
        name: formData.name || `${formData.projectSetup.businessName} Brief`,
        currentPhase,
        status: currentPhase === 8 ? "complete" : "draft",
        projectSetup: JSON.stringify(formData.projectSetup),
        industryResearch: JSON.stringify(formData.industryResearch),
        buyerPersona: JSON.stringify(formData.buyerPersona),
        offerDefinition: JSON.stringify(formData.offerDefinition),
        positioning: JSON.stringify(formData.positioning),
        copyGeneration: JSON.stringify(formData.copyGeneration),
        designDirection: JSON.stringify(formData.designDirection),
        buildBrief: formData.buildBrief,
      });
    } finally {
      setSaving(false);
    }
  }, [formData, currentPhase, onSave]);

  const handleGenerate = useCallback(async (phase: string) => {
    setGenerating(true);
    try {
      const response = await fetch("/api/briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase, context: formData }),
      });
      const result = await response.json();
      if (result.content) {
        if (phase === "buildBrief") {
          setFormData((prev) => ({ ...prev, buildBrief: result.content }));
        } else {
          setFormData((prev) => ({
            ...prev,
            [phase]: { ...prev[phase as keyof typeof prev], ...result.content },
          }));
        }
      }
    } finally {
      setGenerating(false);
    }
  }, [formData]);

  const handleExport = useCallback(() => {
    const blob = new Blob([formData.buildBrief], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${formData.projectSetup.businessName || "website"}-brief.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [formData]);

  const renderPhaseContent = () => {
    switch (currentPhase) {
      case 1:
        return (
          <div className="space-y-4">
            <Field label="Brief Name" value={formData.name} onChange={(v) => setFormData(p => ({...p, name: v}))} placeholder="e.g., Smith Dental Brief" />
            <Field label="Business Name" value={formData.projectSetup.businessName} onChange={(v) => updateField("projectSetup", "businessName", v)} placeholder="e.g., Smith Family Dental" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Industry" value={formData.projectSetup.industry} onChange={(v) => updateField("projectSetup", "industry", v)} placeholder="e.g., Dental Practice" />
              <Field label="Location" value={formData.projectSetup.location} onChange={(v) => updateField("projectSetup", "location", v)} placeholder="e.g., Riverside, CA" />
            </div>
            <Field label="Current Website (if any)" value={formData.projectSetup.websiteUrl} onChange={(v) => updateField("projectSetup", "websiteUrl", v)} placeholder="https://..." />
            <div>
              <label className="block text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest mb-2">Project Type</label>
              <div className="flex gap-2">
                {["new", "redesign", "landing"].map((t) => (
                  <button key={t} onClick={() => updateField("projectSetup", "projectType", t)}
                    className={cn("px-4 py-2 rounded-lg text-xs transition-colors capitalize",
                      formData.projectSetup.projectType === t ? "bg-[var(--accent)] text-[var(--bg-base)]" : "bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                    )}>{t === "new" ? "New Site" : t === "redesign" ? "Redesign" : "Landing Page"}</button>
                ))}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><GenerateBtn onClick={() => handleGenerate("industryResearch")} loading={generating} /></div>
            <TextArea label="Industry Overview" value={formData.industryResearch.overview} onChange={(v) => updateField("industryResearch", "overview", v)} rows={3} />
            <TextArea label="Buyer Pain Points" value={formData.industryResearch.painPoints} onChange={(v) => updateField("industryResearch", "painPoints", v)} rows={4} />
            <TextArea label="Purchase Triggers" value={formData.industryResearch.triggers} onChange={(v) => updateField("industryResearch", "triggers", v)} rows={3} />
            <TextArea label="Trust Signals" value={formData.industryResearch.trustSignals} onChange={(v) => updateField("industryResearch", "trustSignals", v)} rows={3} />
            <TextArea label="Competitors" value={formData.industryResearch.competitors} onChange={(v) => updateField("industryResearch", "competitors", v)} rows={3} />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><GenerateBtn onClick={() => handleGenerate("buyerPersona")} loading={generating} /></div>
            <TextArea label="Demographics" value={formData.buyerPersona.demographics} onChange={(v) => updateField("buyerPersona", "demographics", v)} rows={3} />
            <TextArea label="Psychographics" value={formData.buyerPersona.psychographics} onChange={(v) => updateField("buyerPersona", "psychographics", v)} rows={3} />
            <TextArea label="Goals & Motivations" value={formData.buyerPersona.goals} onChange={(v) => updateField("buyerPersona", "goals", v)} rows={3} />
            <TextArea label="Fears & Objections" value={formData.buyerPersona.fears} onChange={(v) => updateField("buyerPersona", "fears", v)} rows={3} />
            <TextArea label="Decision Factors" value={formData.buyerPersona.decisionFactors} onChange={(v) => updateField("buyerPersona", "decisionFactors", v)} rows={3} />
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><GenerateBtn onClick={() => handleGenerate("offerDefinition")} loading={generating} /></div>
            <TextArea label="Core Service" value={formData.offerDefinition.coreService} onChange={(v) => updateField("offerDefinition", "coreService", v)} rows={3} />
            <Field label="Pricing Model" value={formData.offerDefinition.pricing} onChange={(v) => updateField("offerDefinition", "pricing", v)} />
            <TextArea label="Key Differentiators" value={formData.offerDefinition.differentiators} onChange={(v) => updateField("offerDefinition", "differentiators", v)} rows={4} />
            <Field label="Guarantee" value={formData.offerDefinition.guarantee} onChange={(v) => updateField("offerDefinition", "guarantee", v)} />
            <Field label="Primary CTA" value={formData.offerDefinition.primaryCta} onChange={(v) => updateField("offerDefinition", "primaryCta", v)} placeholder="e.g., Schedule Free Consultation" />
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><GenerateBtn onClick={() => handleGenerate("positioning")} loading={generating} /></div>
            <TextArea label="Competitive Advantages" value={formData.positioning.advantages} onChange={(v) => updateField("positioning", "advantages", v)} rows={4} />
            <TextArea label="Unique Selling Points" value={formData.positioning.uniqueSellingPoints} onChange={(v) => updateField("positioning", "uniqueSellingPoints", v)} rows={3} />
            <TextArea label="Positioning Statement" value={formData.positioning.positioningStatement} onChange={(v) => updateField("positioning", "positioningStatement", v)} rows={3} />
            <TextArea label="'Only We...' Statement" value={formData.positioning.onlyWe} onChange={(v) => updateField("positioning", "onlyWe", v)} rows={2} />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><GenerateBtn onClick={() => handleGenerate("copyGeneration")} loading={generating} /></div>
            <div className="grid grid-cols-2 gap-4">
              <TextArea label="Hero Headline" value={formData.copyGeneration.heroHeadline} onChange={(v) => updateField("copyGeneration", "heroHeadline", v)} rows={2} />
              <TextArea label="Hero Subhead" value={formData.copyGeneration.heroSubhead} onChange={(v) => updateField("copyGeneration", "heroSubhead", v)} rows={2} />
            </div>
            <TextArea label="Problem Statement" value={formData.copyGeneration.problemStatement} onChange={(v) => updateField("copyGeneration", "problemStatement", v)} rows={3} />
            <TextArea label="Solution Statement" value={formData.copyGeneration.solutionStatement} onChange={(v) => updateField("copyGeneration", "solutionStatement", v)} rows={3} />
            <TextArea label="Key Benefits" value={formData.copyGeneration.benefits} onChange={(v) => updateField("copyGeneration", "benefits", v)} rows={4} />
            <TextArea label="Social Proof" value={formData.copyGeneration.socialProof} onChange={(v) => updateField("copyGeneration", "socialProof", v)} rows={3} />
            <TextArea label="FAQ" value={formData.copyGeneration.faq} onChange={(v) => updateField("copyGeneration", "faq", v)} rows={4} />
            <TextArea label="CTA Variations" value={formData.copyGeneration.ctaVariations} onChange={(v) => updateField("copyGeneration", "ctaVariations", v)} rows={3} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <div className="flex justify-end"><GenerateBtn onClick={() => handleGenerate("designDirection")} loading={generating} /></div>
            <div>
              <label className="block text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest mb-2">Style</label>
              <div className="flex flex-wrap gap-2">
                {["modern", "classic", "bold", "minimal", "warm", "professional"].map((s) => (
                  <button key={s} onClick={() => updateField("designDirection", "style", s)}
                    className={cn("px-4 py-2 rounded-lg text-xs capitalize transition-colors",
                      formData.designDirection.style === s ? "bg-[var(--accent)] text-[var(--bg-base)]" : "bg-[var(--bg-hover)] text-[var(--text-tertiary)]"
                    )}>{s}</button>
                ))}
              </div>
            </div>
            <TextArea label="Color Palette" value={formData.designDirection.colorPalette} onChange={(v) => updateField("designDirection", "colorPalette", v)} rows={4} />
            <TextArea label="Typography" value={formData.designDirection.typography} onChange={(v) => updateField("designDirection", "typography", v)} rows={3} />
            <TextArea label="Reference Sites" value={formData.designDirection.references} onChange={(v) => updateField("designDirection", "references", v)} rows={3} />
            <Field label="Mood Keywords" value={formData.designDirection.moodKeywords} onChange={(v) => updateField("designDirection", "moodKeywords", v)} />
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-[var(--text-tertiary)]">Compile all phases into BUILD-BRIEF.md</p>
              <div className="flex gap-2">
                <GenerateBtn onClick={() => handleGenerate("buildBrief")} loading={generating} label="Compile Brief" />
                {formData.buildBrief && (
                  <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg text-xs">
                    <Download size={14} /> Export
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={formData.buildBrief}
              onChange={(e) => setFormData(p => ({ ...p, buildBrief: e.target.value }))}
              className="w-full min-h-[500px] p-4 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-secondary)] text-sm font-mono resize-none focus:outline-none"
              placeholder="Click 'Compile Brief' to generate..."
            />
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Sidebar */}
      <div className="w-56 shrink-0">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl p-4 sticky top-4">
          <h3 className="text-xs font-medium text-[var(--text-primary)] mb-4">Phases</h3>
          <div className="space-y-1">
            {PHASES.map((phase) => {
              const Icon = phase.icon;
              const isComplete = currentPhase > phase.id;
              const isCurrent = currentPhase === phase.id;
              return (
                <button key={phase.id} onClick={() => setCurrentPhase(phase.id)}
                  className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                    isCurrent ? "bg-[var(--accent-muted)] text-[var(--accent)]" : isComplete ? "text-[var(--text-secondary)]" : "text-[var(--text-quaternary)]",
                    "hover:bg-[var(--bg-hover)]"
                  )}>
                  <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px]",
                    isComplete ? "bg-[var(--accent)] text-[var(--bg-base)]" : isCurrent ? "bg-[var(--accent-muted)]" : "bg-[var(--bg-hover)]"
                  )}>{isComplete ? <Check size={12} /> : phase.id}</div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{phase.name}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl">
          <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
            <h2 className="font-display text-lg text-[var(--text-primary)]">{PHASES[currentPhase - 1].name}</h2>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{PHASES[currentPhase - 1].description}</p>
          </div>
          <div className="p-6">{renderPhaseContent()}</div>
          <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <button onClick={() => setCurrentPhase(Math.max(1, currentPhase - 1))} disabled={currentPhase === 1}
              className={cn("px-4 py-2 rounded-lg text-xs", currentPhase === 1 ? "text-[var(--text-quaternary)]" : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]")}>
              Previous
            </button>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-[var(--bg-hover)] text-[var(--text-secondary)] rounded-lg text-xs">
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save
              </button>
              <button onClick={() => { handleSave(); setCurrentPhase(Math.min(8, currentPhase + 1)); }} disabled={currentPhase === 8}
                className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-xs",
                  currentPhase === 8 ? "bg-[var(--bg-hover)] text-[var(--text-quaternary)]" : "bg-[var(--accent)] text-[var(--bg-base)]"
                )}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="block text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest mb-2">{label}</label>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-sm placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[var(--border-strong)]" />
    </div>
  );
}

function TextArea({ label, value, onChange, rows = 4 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div>
      <label className="block text-[10px] text-[var(--text-quaternary)] uppercase tracking-widest mb-2">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows}
        className="w-full px-4 py-3 bg-[var(--bg-base)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)] text-sm placeholder:text-[var(--text-quaternary)] focus:outline-none focus:border-[var(--border-strong)] resize-none" />
    </div>
  );
}

function GenerateBtn({ onClick, loading, label = "Generate" }: { onClick: () => void; loading: boolean; label?: string }) {
  return (
    <button onClick={onClick} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-muted)] text-[var(--accent)] rounded-lg text-xs disabled:opacity-50">
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} {label}
    </button>
  );
}
