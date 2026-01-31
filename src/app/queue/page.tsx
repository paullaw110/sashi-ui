export const metadata = { title: "Queue" };

import { db, schema } from "@/lib/db";
import { desc } from "drizzle-orm";
import { QueueBoard } from "@/components/QueueBoard";
import { AppLayout } from "@/components/AppLayout";

async function getQueueItems() {
  return await db.query.sashiQueue.findMany({
    orderBy: [desc(schema.sashiQueue.createdAt)],
  });
}

export default async function QueuePage() {
  const items = await getQueueItems();

  return (
    <AppLayout title="Queue" subtitle="What I'm working on for you">
      <QueueBoard items={items} />
    </AppLayout>
  );
}
