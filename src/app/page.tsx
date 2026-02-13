import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { TokenOnboardingForm } from "@/components/onboarding/token-onboarding-form";

export default function Home() {
  return (
    <AppShell
      heading="Vercel Better Env"
      subheading="Local matrix editor for Vercel environment variables."
      actions={<Badge variant="secondary">Local-only v1</Badge>}
    >
      <section className="grid max-w-4xl gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="rounded-lg border border-border bg-card p-5">
          <h2 className="text-lg font-medium">Connect your Vercel account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Paste a personal token to start a local-only session.
          </p>
          <div className="mt-4">
            <TokenOnboardingForm />
          </div>
        </div>
        <aside className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Session safety</p>
          <p className="mt-2">Your token is kept in memory for this local run only.</p>
        </aside>
      </section>
    </AppShell>
  );
}
