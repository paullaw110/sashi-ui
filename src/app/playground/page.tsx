import { AppLayout } from "@/components/AppLayout";
import { CodePlayground } from "@/components/CodePlayground";

export const metadata = { title: "Code Playground" };

export default function PlaygroundPage() {
  return (
    <AppLayout>
      <CodePlayground />
    </AppLayout>
  );
}