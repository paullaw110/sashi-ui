"use client";

import { useState } from "react";
import { ExternalLink, Star, Gauge, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  skipped: { label: "Skipped", color: "text-muted-foreground", bg: "bg-secondary" },
  disqualified: { label: "Disqualified", color: "text-red-400", bg: "bg-red-400/10" },
};

function getScoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-muted-foreground";
}

function getPageSpeedColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score < 30) return "text-red-400";
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

  const industries = [...new Set(leads.map(l => l.industry))].sort();

  const filteredLeads = leads.filter((lead) => {
    if (filterStatus && lead.status !== filterStatus) return false;
    if (filterIndustry && lead.industry !== filterIndustry) return false;
    return true;
  });

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
    <div className="rounded-lg border">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold">Leads</h2>
          <span className="text-xs text-muted-foreground">{filteredLeads.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus || "all"}
            onValueChange={(v) => setFilterStatus(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                <SelectItem key={value} value={value}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterIndustry || "all"}
            onValueChange={(v) => setFilterIndustry(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="All Industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>{industry}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-[100px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="score">Score</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="date">Newest</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRunScrape}
            disabled={isLoading}
            className="h-8 text-xs"
          >
            <RefreshCw size={12} className={cn("mr-1", isLoading && "animate-spin")} />
            {isLoading ? "Scraping..." : "Run Scrape"}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Score</TableHead>
            <TableHead>Business</TableHead>
            <TableHead className="w-20">Rating</TableHead>
            <TableHead className="w-16">PageSpeed</TableHead>
            <TableHead className="w-20">Status</TableHead>
            <TableHead className="w-20">Actions</TableHead>
            <TableHead className="w-8"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.slice(0, 50).map((lead) => {
            const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
            
            return (
              <TableRow
                key={lead.id}
                onClick={() => onLeadClick?.(lead)}
                className={cn(
                  "cursor-pointer",
                  (lead.status === "skipped" || lead.status === "disqualified") && "opacity-40"
                )}
              >
                <TableCell className={cn("font-mono font-medium", getScoreColor(lead.qualificationScore))}>
                  {lead.qualificationScore ?? "—"}
                </TableCell>

                <TableCell>
                  <div className="text-sm truncate">{lead.businessName}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {lead.industry} • {lead.location}
                  </div>
                </TableCell>

                <TableCell>
                  {lead.googleRating ? (
                    <div className="flex items-center gap-1">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs">
                        {(lead.googleRating / 10).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({lead.reviewCount})
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    <Gauge size={11} className={getPageSpeedColor(lead.pagespeedScore)} />
                    <span className={cn("text-xs font-mono", getPageSpeedColor(lead.pagespeedScore))}>
                      {lead.pagespeedScore ?? "—"}
                    </span>
                  </div>
                </TableCell>

                <TableCell>
                  <span className={cn(
                    "inline-flex text-[10px] px-1.5 py-0.5 rounded",
                    statusConfig.bg,
                    statusConfig.color
                  )}>
                    {statusConfig.label}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-1">
                    {lead.status === "new" && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-emerald-400 hover:bg-emerald-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange?.(lead.id, "approved");
                          }}
                          title="Approve"
                        >
                          <Check size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-amber-400 hover:bg-amber-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange?.(lead.id, "skipped");
                          }}
                          title="Skip"
                        >
                          <RefreshCw size={12} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:text-red-400 hover:bg-red-400/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            onStatusChange?.(lead.id, "disqualified");
                          }}
                          title="Disqualify"
                        >
                          <X size={12} />
                        </Button>
                      </>
                    )}
                    {lead.status === "skipped" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 hover:text-blue-400 hover:bg-blue-400/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          onStatusChange?.(lead.id, "new");
                        }}
                        title="Move back"
                      >
                        <RefreshCw size={12} />
                      </Button>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  {lead.websiteUrl && (
                    <a
                      href={lead.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </TableCell>
              </TableRow>
            );
          })}

          {sortedLeads.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                No leads yet. Click "Run Scrape" to find prospects.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {sortedLeads.length > 50 && (
        <div className="px-4 py-2 text-center text-xs text-muted-foreground border-t">
          +{sortedLeads.length - 50} more
        </div>
      )}
    </div>
  );
}
