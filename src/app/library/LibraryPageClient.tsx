"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Settings,
  Zap,
  MessageSquare,
  BarChart3,
  CheckCircle2,
  Clock,
  Circle,
  Pause,
  Sun,
  Moon,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { SkillsManager } from "@/components/SkillsManager";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { format, parseISO } from "date-fns";

type PRD = {
  filename: string;
  title: string;
  status: "draft" | "in_progress" | "built" | "on_hold";
  content: string;
};

type ConfigFile = {
  filename: string;
  content: string;
};

type Report = {
  id: string;
  type: "morning" | "nightly";
  date: string;
  title: string;
  content: string;
  metadata?: string;
  createdAt: number;
};

interface LibraryPageClientProps {
  prds: PRD[];
  configs: ConfigFile[];
}

const STATUS_CONFIG = {
  draft: { label: "Draft", icon: Circle, color: "text-[var(--text-quaternary)]", bg: "bg-[var(--bg-surface)]" },
  in_progress: { label: "In Progress", icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10" },
  built: { label: "Built", icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
  on_hold: { label: "On Hold", icon: Pause, color: "text-amber-400", bg: "bg-amber-500/10" },
};

export function LibraryPageClient({
  prds,
  configs,
}: LibraryPageClientProps) {
  const [selectedPRD, setSelectedPRD] = useState<PRD | null>(prds[0] || null);
  const [selectedConfig, setSelectedConfig] = useState<ConfigFile | null>(configs[0] || null);
  
  // Reports state
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportFilter, setReportFilter] = useState<"all" | "morning" | "nightly">("all");

  // Fetch reports
  useEffect(() => {
    async function fetchReports() {
      setReportsLoading(true);
      try {
        const url = reportFilter === "all" 
          ? "/api/reports" 
          : `/api/reports?type=${reportFilter}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setReports(data.reports || []);
          if (data.reports?.length > 0 && !selectedReport) {
            setSelectedReport(data.reports[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setReportsLoading(false);
      }
    }
    fetchReports();
  }, [reportFilter]);

  const formatReportDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  return (
    <AppLayout title="Library" subtitle="PRDs, reports, skills, and configuration">
      <Tabs defaultValue="prds" className="space-y-6">
          <TabsList>
            <TabsTrigger value="prds" className="gap-2">
              <FileText size={14} />
              PRDs
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 size={14} />
              Reports
            </TabsTrigger>
            <TabsTrigger value="transcripts" className="gap-2">
              <MessageSquare size={14} />
              Transcripts
            </TabsTrigger>
            <TabsTrigger value="skills" className="gap-2">
              <Zap size={14} />
              Skills
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings size={14} />
              Config
            </TabsTrigger>
          </TabsList>

          {/* PRDs Tab */}
          <TabsContent value="prds">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* PRD List */}
              <div className="lg:col-span-1 space-y-2">
                <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Documents ({prds.length})
                </h2>
                {prds.length === 0 ? (
                  <p className="text-sm text-[var(--text-quaternary)] py-4">
                    No PRDs found in /docs folder
                  </p>
                ) : (
                  prds.map((prd) => {
                    const statusConfig = STATUS_CONFIG[prd.status];
                    const StatusIcon = statusConfig.icon;
                    return (
                      <button
                        key={prd.filename}
                        onClick={() => setSelectedPRD(prd)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedPRD?.filename === prd.filename
                            ? "bg-[var(--bg-surface)] border-[var(--border-strong)]"
                            : "bg-transparent border-transparent hover:bg-[var(--bg-surface)]"
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--text-primary)] truncate pr-2">
                            {prd.title.replace(/^PRD:\s*/, "")}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                              statusConfig.bg,
                              statusConfig.color
                            )}
                          >
                            <StatusIcon size={10} />
                            {statusConfig.label}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-quaternary)] mt-1 truncate">
                          {prd.filename}
                        </p>
                      </button>
                    );
                  })
                )}
              </div>

              {/* PRD Content */}
              <div className="lg:col-span-2">
                {selectedPRD ? (
                  <Card className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
                    <article className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{selectedPRD.content}</ReactMarkdown>
                    </article>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-[var(--text-quaternary)]">
                    Select a PRD to view
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Reports List */}
              <div className="lg:col-span-1 space-y-3">
                {/* Filter */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={() => setReportFilter("all")}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg transition-colors",
                      reportFilter === "all"
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setReportFilter("morning")}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5",
                      reportFilter === "morning"
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Sun size={12} />
                    Morning
                  </button>
                  <button
                    onClick={() => setReportFilter("nightly")}
                    className={cn(
                      "px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5",
                      reportFilter === "nightly"
                        ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    )}
                  >
                    <Moon size={12} />
                    Nightly
                  </button>
                </div>

                <h2 className="text-sm font-medium text-[var(--text-secondary)]">
                  Reports ({reports.length})
                </h2>

                {reportsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw size={20} className="animate-spin text-[var(--text-quaternary)]" />
                  </div>
                ) : reports.length === 0 ? (
                  <div className="py-8 text-center">
                    <BarChart3 size={32} className="text-[var(--text-quaternary)] mx-auto mb-3" />
                    <p className="text-sm text-[var(--text-tertiary)]">
                      No reports yet
                    </p>
                    <p className="text-xs text-[var(--text-quaternary)] mt-1">
                      Reports will appear here when Sashi generates morning or nightly summaries
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {reports.map((report) => (
                      <button
                        key={report.id}
                        onClick={() => setSelectedReport(report)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border transition-colors",
                          selectedReport?.id === report.id
                            ? "bg-[var(--bg-surface)] border-[var(--border-strong)]"
                            : "bg-transparent border-transparent hover:bg-[var(--bg-surface)]"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            {report.type === "morning" ? (
                              <Sun size={14} className="text-amber-400" />
                            ) : (
                              <Moon size={14} className="text-blue-400" />
                            )}
                            <span className="text-sm font-medium text-[var(--text-primary)]">
                              {report.title}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[var(--text-quaternary)]">
                          <Calendar size={10} />
                          {formatReportDate(report.date)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Report Content */}
              <div className="lg:col-span-2">
                {selectedReport ? (
                  <Card className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-[var(--border-subtle)]">
                      {selectedReport.type === "morning" ? (
                        <Sun size={20} className="text-amber-400" />
                      ) : (
                        <Moon size={20} className="text-blue-400" />
                      )}
                      <div>
                        <h2 className="font-medium text-[var(--text-primary)]">
                          {selectedReport.title}
                        </h2>
                        <p className="text-xs text-[var(--text-quaternary)]">
                          {formatReportDate(selectedReport.date)}
                        </p>
                      </div>
                    </div>
                    <article className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{selectedReport.content}</ReactMarkdown>
                    </article>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-[var(--text-quaternary)]">
                    {reports.length > 0 ? "Select a report to view" : "No reports available"}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={48} className="text-[var(--text-quaternary)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                Session Transcripts
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-md mb-4">
                Transcripts from Clawdbot sessions will appear here. This feature requires integration with the Clawdbot gateway.
              </p>
              <p className="text-xs text-[var(--text-quaternary)] max-w-sm">
                Coming in a future update: view conversation history, search past sessions, and reference previous context.
              </p>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <SkillsManager />
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Config List */}
              <div className="lg:col-span-1 space-y-2">
                <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Configuration Files
                </h2>
                {configs.length === 0 ? (
                  <p className="text-sm text-[var(--text-quaternary)] py-4">
                    No config files found in workspace
                  </p>
                ) : (
                  configs.map((config) => (
                    <button
                      key={config.filename}
                      onClick={() => setSelectedConfig(config)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border transition-colors",
                        selectedConfig?.filename === config.filename
                          ? "bg-[var(--bg-surface)] border-[var(--border-strong)]"
                          : "bg-transparent border-transparent hover:bg-[var(--bg-surface)]"
                      )}
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {config.filename}
                      </span>
                    </button>
                  ))
                )}
              </div>

              {/* Config Content */}
              <div className="lg:col-span-2">
                {selectedConfig ? (
                  <Card className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
                    <article className="prose prose-invert prose-sm max-w-none">
                      <ReactMarkdown>{selectedConfig.content}</ReactMarkdown>
                    </article>
                  </Card>
                ) : (
                  <div className="flex items-center justify-center h-64 text-[var(--text-quaternary)]">
                    Select a config file to view
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
    </AppLayout>
  );
}
