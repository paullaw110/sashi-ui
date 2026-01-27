export const metadata = { title: "Inbox" };

import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { InboxView } from "@/components/InboxView";
import { AppLayout } from "@/components/AppLayout";

async function getInboxItems() {
  return await db.query.inboxItems.findMany({
    orderBy: [desc(schema.inboxItems.createdAt)],
    limit: 100,
  });
}

export default async function InboxPage() {
  const items = await getInboxItems();

  return (
    <AppLayout title="Inbox" subtitle="Capture thoughts, links, and ideas">
      <InboxView items={items} />
    </AppLayout>
  );
}
