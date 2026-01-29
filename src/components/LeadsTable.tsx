"use client";

import { useState } from "react";
import { Plus, ExternalLink, Star, Gauge, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface LeadsTableProps {
  leads: Lead[];
  onLeadClick?: (lead: Lead) => void;
  onStatusChange?: (leadId: string, status: string) => void;
  onRunScrape?: () => void;
  isLoading?: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New", color: "text-blue-400", bg: "bg-blue-400/10" },
  approved: { label: "Approved", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  brief_created: { label: "Brief", color: "text-amber-400", bg: "bg-amber-400/10" },
  site_built: { label: "Built", color: "text-purple-400", bg: "bg-purple-400/10" },
  outreach_sent: { label: "Outreach", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  converted: { label: "Converted", color: "text-green-400", bg: "bg-green-400/10" },
  lost: { label: "Lost", color: "text-red-400", bg: "bg-red-400/10" },
  skipped: { label: "Skipped", color: "text-[#525252]", bg: "bg-[#1a1a1a]" },
  disqualified: { label: "Disqualified", color: "text-red-400", bg: "bg-red-400/10" },
};

function getScoreColor(score: number | null) {
  if (score === null) return "text-[#404040]";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-[#525252]";
}

function getPageSpeedColor(score: number | null) {
  if (score === null) return "text-[#404040]";
  if (score < 30) return "text-red-400"; // Bad site = good prospect
  if (score < 50) return "text-orange-400";
  if (score < 70) return "text-amber-400";
  return "text-emerald-400";
}

export function LeadsTable({ 
  leads, 
  onLeadClick,
  onStatusChange,
  onRunScrape,
  isLoading,
}: LeadsTableProps) {
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"score" | "date" | "rating">("score");

  // Get unique industries from leads
  const industries = [...new Set(leads.map(l => l.industry))].sort();

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    if (filterStatus && lead.status !== filterStatus) return false;
    if (filterIndustry && lead.industry !== filterIndustry) return false;
    return true;
  });

  // Sort leads
  const sortedLeads = [...filteredLeads].sort((a, b) => {
    switch (sortBy) {
      case "score":
        return (b.qualificationScore || 0) - (a.qualificationScore || 0);
      case "rating":
        return (b.googleRating || 0) - (a.googleRating || 0);
      case "date":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  return (
    <div className="bg-[#111] rounded-lg border border-[#1a1a1a]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-base text-[#f5f5f5]">Leads</h2>
          <span className="text-[10px] text-[#404040]">{filteredLeads.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filterStatus || ""}
            onChange={(e) => setFilterStatus(e.target.value || null)}
            className="text-[11px] text-[#525252] bg-transparent border border-[#222] px-2 py-1 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
              <option key={value} value={value}>{config.label}</option>
            ))}
          </select>
          <select
            value={filterIndustry || ""}
            onChange={(e) => setFilterIndustry(e.target.value || null)}
            className="text-[11px] text-[#525252] bg-transparent border border-[#222] px-2 py-1 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="">All Industries</option>
            {industries.map((industry) => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-[11px] text-[#525252] bg-transparent border border-[#222] px-2 py-1 rounded hover:border-[#333] focus:outline-none transition-colors"
          >
            <option value="score">Score</option>
            <option value="rating">Rating</option>
            <option value="date">Newest</option>
          </select>
          <button 
            onClick={onRunScrape}
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors",
              isLoading 
                ? "text-[#404040] cursor-not-allowed" 
                : "text-[#525252] hover:text-[#a3a3a3] hover:bg-[#1a1a1a]"
            )}
          >
            <RefreshCw size={12} className={cn(isLoading && "animate-spin")} />
            {isLoading ? "Scraping..." : "Run Scrape"}
          </button>
        </div>
      </div>

      {/* Column Headers */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1a1a1a] text-[9px] text-[#404040] uppercase tracking-widest">
        <div className="w-14">Score</div>
        <div className="flex-1">Business</div>
        <div className="w-20">Rating</div>
        <div className="w-16">PageSpeed</div>
        <div className="w-20">Status</div>
        <div className="w-20">Actions</div>
        <div className="w-8"></div>
      </div>

      {/* Rows */}
      <div className="divide-y divide-[#161616]">
        {sortedLeads.slice(0, 50).map((lead) => {
          const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
          
          return (
            <div
              key={lead.id}
              onClick={() => onLeadClick?.(lead)}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 hover:bg-[#161616] cursor-pointer transition-colors",
                (lead.status === "skipped" || lead.status === "disqualified") && "opacity-40"
              )}
            >
              {/* Qualification Score */}
              <div className={cn("w-14 text-sm font-mono font-medium", getScoreColor(lead.qualificationScore))}>
                {lead.qualificationScore ?? "—"}
              </div>

              {/* Business Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#e5e5e5] truncate">{lead.businessName}</div>
                <div className="text-[10px] text-[#525252] truncate">
                  {lead.industry} • {lead.location}
                </div>
              </div>

              {/* Google Rating */}
              <div className="w-20 flex items-center gap-1">
                {lead.googleRating ? (
                  <>
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    <span className="text-[11px] text-[#a3a3a3]">
                      {(lead.googleRating / 10).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-[#404040]">
                      ({lead.reviewCount})
                    </span>
                  </>
                ) : (
                  <span className="text-[10px] text-[#404040]">—</span>
                )}
              </div>

              {/* PageSpeed Score */}
              <div className="w-16 flex items-center gap-1">
                <Gauge size={11} className={getPageSpeedColor(lead.pagespeedScore)} />
                <span className={cn("text-[11px] font-mono", getPageSpeedColor(lead.pagespeedScore))}>
                  {lead.pagespeedScore ?? "—"}
                </span>
              </div>

              {/* Status */}
              <div className="w-20">
                <span className={cn(
                  "inline-flex text-[10px] px-1.5 py-0.5 rounded",
                  statusConfig.bg,
                  statusConfig.color
                )}>
                  {statusConfig.label}
                </span>
              </div>

              {/* Quick Actions */}
              <div className="w-20 flex items-center gap-1">
                {lead.status === "new" && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(lead.id, "approved");
                      }}
                      title="Approve"
                      className="p-1 text-[#404040] hover:text-emerald-400 hover:bg-emerald-400/10 rounded transition-colors"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(lead.id, "skipped");
                      }}
                      title="Skip for later"
                      className="p-1 text-[#404040] hover:text-amber-400 hover:bg-amber-400/10 rounded transition-colors"
                    >
                      <RefreshCw size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStatusChange?.(lead.id, "disqualified");
                      }}
                      title="Disqualify"
                      className="p-1 text-[#404040] hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
                {lead.status === "skipped" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStatusChange?.(lead.id, "new");
                    }}
                    title="Move back to New"
                    className="p-1 text-[#404040] hover:text-blue-400 hover:bg-blue-400/10 rounded transition-colors"
                  >
                    <RefreshCw size={12} />
                  </button>
                )}
              </div>

              {/* External Link */}
              <div className="w-8 flex justify-end">
                {lead.websiteUrl && (
                  <a
                    href={lead.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-[#404040] hover:text-[#737373] transition-colors"
                  >
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>
          );
        })}

        {sortedLeads.length === 0 && (
          <div className="px-4 py-10 text-center text-[#404040] text-xs">
            No leads yet. Click "Run Scrape" to find prospects.
          </div>
        )}

        {sortedLeads.length > 50 && (
          <div className="px-4 py-2 text-center text-[#333] text-[10px]">
            +{sortedLeads.length - 50} more
          </div>
        )}
      </div>
    </div>
  );
}
