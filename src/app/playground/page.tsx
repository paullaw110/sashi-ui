import { AppLayout } from "@/components/AppLayout";
import { CodePlayground } from "@/components/CodePlayground";

export const metadata = { title: "Code Playground" };

export default function PlaygroundPage() {
  return (
    <AppLayout title="Code Playground" subtitle="Experiment and test your code">
      <CodePlayground />
    </AppLayout>
  );
}