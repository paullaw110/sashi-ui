export const metadata = { title: "Notes" };

import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { AppLayout } from "@/components/AppLayout";
import { NotesView } from "@/components/NotesView";

export const dynamic = "force-dynamic";

async function getNotes() {
  const notes = await db.query.notes.findMany({
    orderBy: [desc(schema.notes.updatedAt)],
  });
  return notes;
}

export default async function NotesPage() {
  const notes = await getNotes();
  
  return (
    <AppLayout title="Notes" subtitle="Quick thoughts and documentation">
      <NotesView notes={notes} />
    </AppLayout>
  );
}
