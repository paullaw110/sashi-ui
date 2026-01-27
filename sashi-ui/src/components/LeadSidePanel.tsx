"use client";

import { useState, useEffect } from "react";
import { X, Trash2, ExternalLink, Star, Gauge, Globe, Phone, Mail, MapPin, AlertTriangle, Check, ShieldX, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Lead = {
  id: string;
  businessName: string;
  industry: string;
  location: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  websiteScreenshot: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  topReviews: string | null;
  pagespeedScore: number | null;
  mobileFriendly: boolean | null;
  hasSSL: boolean | null;
  techStack: string | null;
  qualificationScore: number | null;
  issuesDetected: string | null;
  status: string;
  notes: string | null;
  briefUrl: string | null;
  previewSiteUrl: string | null;
  outreachSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

interface LeadSidePanelProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-400/10" },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  brief_created: { label: "Brief Created", color: "text-amber-400", bg: "bg-amber-400/10" },
  site_built: { label: "Site Built", color: "text-purple-400", bg: "bg-purple-400/10" },
  outreach_sent: { label: "Outreach Sent", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  converted: { label: "Converted", color: "text-green-400", bg: "bg-green-400/10" },
  lost: { label: "Lost", color: "text-red-400", bg: "bg-red-400/10" },
  skipped: { label: "Skipped", color: "text-[#525252]", bg: "bg-[#1a1a1a]" },
};

const STATUSES = Object.entries(STATUS_CONFIG).map(([value, config]) => ({
  value,
  label: config.label,
}));

function getScoreColor(score: number | null) {
  if (score === null) return "text-[#404040]";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-[#525252]";
}

export function LeadSidePanel({
  lead,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: LeadSidePanelProps) {
  const [status, setStatus] = useState("new");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNotes(lead.notes || "");
      setHasChanges(false);
    }
  }, [lead]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setHasChanges(true);
  };

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!lead?.id) return;
    setSaving(true);
    try {
      await onSave({
        id: lead.id,
        status,
        notes: notes || null,
      });
      setHasChanges(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!lead?.id) return;
    if (!confirm("Delete this lead?")) return;
    await onDelete(lead.id);
    onClose();
  };

  const handleQuickAction = async (action: "approve" | "skip") => {
    if (!lead?.id) return;
    const newStatus = action === "approve" ? "approved" : "skipped";
    setSaving(true);
    try {
      await onSave({ id: lead.id, status: newStatus });
    } finally {
      setSaving(false);
    }
  };

  // Parse JSON fields
  const issues: string[] = lead?.issuesDetected ? JSON.parse(lead.issuesDetected) : [];
  const reviews: string[] = lead?.topReviews ? JSON.parse(lead.topReviews) : [];
  const techStack: string[] = lead?.techStack ? JSON.parse(lead.techStack) : [];

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 z-40 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-[480px] bg-[#0c0c0c] border-l border-[#1a1a1a] z-50 transform transition-transform duration-300 ease-out overflow-y-auto",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1a1a1a] sticky top-0 bg-[#0c0c0c] z-10">
          <span className="font-display text-lg text-[#f5f5f5]">Lead Details</span>
          <button 
            onClick={onClose}
            className="p-1.5 text-[#404040] hover:text-[#737373] hover:bg-[#1a1a1a] rounded transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {lead && (
          <>
            {/* Body */}
            <div className="p-6 space-y-6">
              {/* Business Header */}
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-xl text-[#f5f5f5]">{lead.businessName}</h2>
                    <p className="text-sm text-[#525252] mt-1">{lead.industry} • {lead.location}</p>
                  </div>
                  <div className={cn("text-3xl font-mono font-bold", getScoreColor(lead.qualificationScore))}>
                    {lead.qualificationScore ?? "—"}
                  </div>
                </div>

                {/* Quick Actions (only for new leads) */}
                {lead.status === "new" && (
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={() => handleQuickAction("approve")}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/20 transition-colors"
                    >
                      <Check size={16} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleQuickAction("skip")}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#1a1a1a] text-[#737373] rounded-lg text-sm hover:bg-[#222] transition-colors"
                    >
                      <X size={16} />
                      Skip
                    </button>
                  </div>
                )}
              </div>

              {/* Contact Info */}
              <div className="bg-[#111] rounded-lg border border-[#1a1a1a] divide-y divide-[#1a1a1a]">
                {lead.phone && (
                  <a href={`tel:${lead.phone}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#161616] transition-colors">
                    <Phone size={14} className="text-[#525252]" />
                    <span className="text-sm text-[#a3a3a3]">{lead.phone}</span>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="flex items-center gap-3 px-4 py-3 hover:bg-[#161616] transition-colors">
                    <Mail size={14} className="text-[#525252]" />
                    <span className="text-sm text-[#a3a3a3]">{lead.email}</span>
                  </a>
                )}
                {lead.websiteUrl && (
                  <a href={lead.websiteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 hover:bg-[#161616] transition-colors">
                    <Globe size={14} className="text-[#525252]" />
                    <span className="text-sm text-[#a3a3a3] truncate">{lead.websiteUrl.replace(/^https?:\/\//, "")}</span>
                    <ExternalLink size={12} className="text-[#404040] ml-auto shrink-0" />
                  </a>
                )}
                {lead.address && (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <MapPin size={14} className="text-[#525252] mt-0.5 shrink-0" />
                    <span className="text-sm text-[#a3a3a3]">{lead.address}</span>
                  </div>
                )}
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Google Rating */}
                <div className="bg-[#111] rounded-lg border border-[#1a1a1a] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span className="text-[10px] text-[#525252] uppercase tracking-widest">Rating</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-display text-[#f5f5f5]">
                      {lead.googleRating ? (lead.googleRating / 10).toFixed(1) : "—"}
                    </span>
                    {lead.reviewCount && (
                      <span className="text-xs text-[#525252]">{lead.reviewCount} reviews</span>
                    )}
                  </div>
                </div>

                {/* PageSpeed */}
                <div className="bg-[#111] rounded-lg border border-[#1a1a1a] p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Gauge size={14} className={cn(
                      lead.pagespeedScore !== null && lead.pagespeedScore < 50 ? "text-red-400" : "text-[#525252]"
                    )} />
                    <span className="text-[10px] text-[#525252] uppercase tracking-widest">PageSpeed</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={cn(
                      "text-2xl font-display",
                      lead.pagespeedScore !== null && lead.pagespeedScore < 50 ? "text-red-400" : "text-[#f5f5f5]"
                    )}>
                      {lead.pagespeedScore ?? "—"}
                    </span>
                    {lead.pagespeedScore !== null && lead.pagespeedScore < 50 && (
                      <span className="text-xs text-red-400/60">Poor</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Issues Detected */}
              {issues.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-amber-400" />
                    <span className="text-[10px] text-[#404040] uppercase tracking-widest">Issues Detected</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {issues.map((issue, i) => (
                      <span key={i} className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded">
                        {issue}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tech Stack & Security */}
              <div className="flex flex-wrap gap-3">
                {lead.mobileFriendly !== null && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs px-2 py-1 rounded",
                    lead.mobileFriendly ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    <Smartphone size={12} />
                    {lead.mobileFriendly ? "Mobile OK" : "Not Mobile"}
                  </div>
                )}
                {lead.hasSSL !== null && (
                  <div className={cn(
                    "flex items-center gap-1.5 text-xs px-2 py-1 rounded",
                    lead.hasSSL ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {lead.hasSSL ? <Check size={12} /> : <ShieldX size={12} />}
                    {lead.hasSSL ? "HTTPS" : "No SSL"}
                  </div>
                )}
                {techStack.map((tech, i) => (
                  <span key={i} className="text-xs px-2 py-1 bg-[#1a1a1a] text-[#737373] rounded">
                    {tech}
                  </span>
                ))}
              </div>

              {/* Top Reviews */}
              {reviews.length > 0 && (
                <div>
                  <span className="text-[10px] text-[#404040] uppercase tracking-widest block mb-3">Top Reviews</span>
                  <div className="space-y-2">
                    {reviews.slice(0, 3).map((review, i) => (
                      <div key={i} className="bg-[#111] rounded-lg border border-[#1a1a1a] p-3">
                        <p className="text-xs text-[#a3a3a3] italic">"{review}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Status</label>
                <select
                  value={status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm focus:outline-none focus:border-[#404040] transition-colors"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] text-[#404040] uppercase tracking-widest mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add notes, personalization angles, observations..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#a3a3a3] text-sm placeholder:text-[#333] focus:outline-none focus:border-[#404040] transition-colors resize-none"
                />
              </div>

              {/* Links (if available) */}
              {(lead.briefUrl || lead.previewSiteUrl) && (
                <div>
                  <span className="text-[10px] text-[#404040] uppercase tracking-widest block mb-3">Generated Assets</span>
                  <div className="space-y-2">
                    {lead.briefUrl && (
                      <a
                        href={lead.briefUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-[#111] rounded-lg border border-[#1a1a1a] hover:border-[#333] transition-colors"
                      >
                        <span className="text-sm text-[#a3a3a3]">Website Brief</span>
                        <ExternalLink size={14} className="text-[#525252]" />
                      </a>
                    )}
                    {lead.previewSiteUrl && (
                      <a
                        href={lead.previewSiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-4 py-3 bg-[#111] rounded-lg border border-[#1a1a1a] hover:border-[#333] transition-colors"
                      >
                        <span className="text-sm text-[#a3a3a3]">Preview Site</span>
                        <ExternalLink size={14} className="text-[#525252]" />
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-[#1a1a1a] text-[10px] text-[#333] space-y-1">
                <p>Added: {format(new Date(lead.createdAt), "MMM d, yyyy 'at' h:mm a")}</p>
                <p>Updated: {format(new Date(lead.updatedAt), "MMM d, yyyy 'at' h:mm a")}</p>
                {lead.outreachSentAt && (
                  <p>Outreach sent: {format(new Date(lead.outreachSentAt), "MMM d, yyyy 'at' h:mm a")}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-[#0c0c0c] border-t border-[#1a1a1a] px-6 py-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1.5 text-[11px] text-[#525252] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                  Delete
                </button>
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={cn(
                    "text-[11px] px-5 py-2 rounded-lg transition-colors font-medium",
                    hasChanges
                      ? "text-[#0c0c0c] bg-[#e5e5e5] hover:bg-[#f5f5f5]"
                      : "text-[#404040] bg-[#1a1a1a] cursor-not-allowed"
                  )}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
