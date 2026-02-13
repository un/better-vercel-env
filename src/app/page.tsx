import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AppShell } from "@/components/app-shell";

export default function Home() {
  return (
    <AppShell
      heading="Vercel Better Env"
      subheading="Local matrix editor for Vercel environment variables."
      actions={<Badge variant="secondary">Local-only v1</Badge>}
    >
      <div className="flex max-w-xl flex-col gap-3 rounded-lg border border-border bg-card p-4">
        <Input placeholder="Paste your Vercel token in upcoming steps" readOnly />
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          <span className="status-create rounded-full px-2 py-1">create</span>
          <span className="status-update rounded-full px-2 py-1">update</span>
          <span className="status-delete rounded-full px-2 py-1">delete</span>
          <span className="status-unchanged rounded-full px-2 py-1">unchanged</span>
        </div>
        <Button className="w-fit" disabled>
          Continue
        </Button>
      </div>
    </AppShell>
  );
}
