import { AppLayout } from "@/components/AppLayout";
import { SkillsManager } from "@/components/SkillsManager";

export const metadata = { title: "Skills" };

export default function SkillsPage() {
  return (
    <AppLayout title="Sashi Skills" subtitle="Manage and explore Sashi's capabilities">
      <SkillsManager />
    </AppLayout>
  );
}