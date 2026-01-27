"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LeadsTable } from "./LeadsTable";
import { LeadSidePanel } from "./LeadSidePanel";

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

interface LeadsViewProps {
  leads: Lead[];
}

export function LeadsView({ leads }: LeadsViewProps) {
  const router = useRouter();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLeadClick = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setIsPanelOpen(true);
  }, []);

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false);
    setSelectedLead(null);
  }, []);

  const handleSave = useCallback(async (leadData: Partial<Lead>) => {
    if (leadData.id) {
      await fetch(`/api/leads/${leadData.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leadData),
      });
    }
    router.refresh();
  }, [router]);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/leads/${id}`, {
      method: "DELETE",
    });
    router.refresh();
  }, [router]);

  const handleStatusChange = useCallback(async (leadId: string, newStatus: string) => {
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }, [router]);

  const handleRunScrape = useCallback(async () => {
    setIsLoading(true);
    try {
      // This will trigger the scrape via Sashi
      // For now, just show a message — actual implementation will come from Sashi
      const response = await fetch("/api/leads/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          industry: "dentist",
          location: "Riverside, CA",
          quantity: 10, // Start small for testing
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        alert(error.message || "Scrape failed");
      }
      
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  return (
    <>
      <LeadsTable
        leads={leads}
        onLeadClick={handleLeadClick}
        onStatusChange={handleStatusChange}
        onRunScrape={handleRunScrape}
        isLoading={isLoading}
      />

      <LeadSidePanel
        lead={selectedLead}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </>
  );
}
