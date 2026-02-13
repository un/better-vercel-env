import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { AppShell } from "@/components/app-shell";
import { TokenOnboardingForm } from "@/components/onboarding/token-onboarding-form";

export default function Home() {
  return (
    <AppShell
      heading="Vercel Better Env"
      subheading="Local matrix editor for Vercel environment variables."
      actions={<Badge className="rounded-full px-3 py-1">Local-only v1</Badge>}
    >
      <section className="grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="rounded-2xl border border-border/70 bg-card/90 p-6 shadow-[0_12px_32px_-18px_rgba(15,23,42,0.25)] sm:p-7">
          <div className="mb-5 flex flex-wrap items-start gap-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-700">
              <KeyRound className="size-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-semibold tracking-tight">Connect your Vercel account</h2>
              <p className="text-sm text-muted-foreground sm:text-base">
                Use your local Vercel CLI session to start a secure local-only workflow.
              </p>
            </div>
          </div>

          <TokenOnboardingForm />

          <div className="mt-6 grid gap-2 rounded-xl border border-border/70 bg-muted/40 p-3 text-sm text-muted-foreground sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-700" aria-hidden="true" />
              <span>Authentication stays in your Vercel CLI session</span>
            </div>
            <div className="flex items-center gap-2">
              <LockKeyhole className="size-4 text-sky-700" aria-hidden="true" />
              <span>No app-managed auth token storage</span>
            </div>
          </div>
        </div>
        <aside className="rounded-2xl border border-border/70 bg-card/85 p-5 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.3)]">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Session safety</p>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            This app reads your existing Vercel CLI session and never asks you to paste tokens in the UI.
          </p>
          <div className="mt-5 space-y-2">
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
              1. Run vercel login
            </div>
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
              2. Optionally run vercel switch
            </div>
            <div className="rounded-lg border border-border/70 bg-background px-3 py-2 text-sm">
              3. Refresh status and continue
            </div>
          </div>
        </aside>
      </section>
    </AppShell>
  );
}
