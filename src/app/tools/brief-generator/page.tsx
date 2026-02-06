"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { BriefWizard } from "@/components/BriefWizard";

function BriefGeneratorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const briefId = searchParams.get("id");
  
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(!!briefId);

  useEffect(() => {
    if (briefId) {
      fetch(`/api/briefs/${briefId}`)
        .then((res) => res.json())
        .then((data) => {
          setBrief(data.brief);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [briefId]);

  const handleSave = async (data: any) => {
    const method = brief?.id ? "PATCH" : "POST";
    const url = brief?.id ? `/api/briefs/${brief.id}` : "/api/briefs";
    
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    
    const result = await response.json();
    
    if (!brief?.id && result.brief?.id) {
      router.replace(`/tools/brief-generator?id=${result.brief.id}`);
      setBrief(result.brief);
    } else {
      setBrief(result.brief);
    }
    
    return result.brief;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  return <BriefWizard brief={brief} onSave={handleSave} />;
}

export default function BriefGeneratorPage() {
  return (
    <AppLayout 
      title="Brief Generator" 
      subtitle="SuperLandings 8-phase website brief workflow"
    >
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full" />
        </div>
      }>
        <BriefGeneratorContent />
      </Suspense>
    </AppLayout>
  );
}
