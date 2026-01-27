import { db, schema } from "@/lib/db";
import { LeadsView } from "@/components/LeadsView";
import { AppLayout } from "@/components/AppLayout";
import { desc } from "drizzle-orm";

async function getLeads() {
  const leads = await db.query.leads.findMany({
    orderBy: [desc(schema.leads.qualificationScore), desc(schema.leads.createdAt)],
  });
  return leads;
}

export default async function LeadsPage() {
  const leads = await getLeads();

  return (
    <AppLayout title="Leads" subtitle="SuperLandings prospect pipeline">
      <LeadsView leads={leads} />
    </AppLayout>
  );
}
