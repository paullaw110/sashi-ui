"use client";

import { useState } from "react";
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
} from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

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

type Skill = {
  name: string;
  description: string;
};

interface LibraryPageClientProps {
  prds: PRD[];
  configs: ConfigFile[];
  skills: Skill[];
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
  skills,
}: LibraryPageClientProps) {
  const [selectedPRD, setSelectedPRD] = useState<PRD | null>(prds[0] || null);
  const [selectedConfig, setSelectedConfig] = useState<ConfigFile | null>(configs[0] || null);

  return (
    <AppLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-[var(--text-primary)] mb-6">
          Library
        </h1>

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
                {prds.map((prd) => {
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
                })}
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <BarChart3 size={48} className="text-[var(--text-quaternary)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                Reports Coming Soon
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-md">
                Morning and nightly reports will appear here once the reporting
                system is set up.
              </p>
            </div>
          </TabsContent>

          {/* Transcripts Tab */}
          <TabsContent value="transcripts">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={48} className="text-[var(--text-quaternary)] mb-4" />
              <h3 className="text-lg font-medium text-[var(--text-secondary)] mb-2">
                Transcripts Coming Soon
              </h3>
              <p className="text-sm text-[var(--text-tertiary)] max-w-md">
                Session transcripts from the last 30 days will appear here.
              </p>
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills">
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((skill) => (
                <Card key={skill.name} className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-hover)] flex items-center justify-center">
                      <Zap size={18} className="text-[var(--accent-primary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-[var(--text-primary)]">
                        {skill.name}
                      </h3>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        {skill.description}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Config Tab */}
          <TabsContent value="config">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Config List */}
              <div className="lg:col-span-1 space-y-2">
                <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                  Configuration Files
                </h2>
                {configs.map((config) => (
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
                ))}
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
      </div>
    </AppLayout>
  );
}
