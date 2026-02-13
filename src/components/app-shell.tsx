import type { ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  heading: string;
  subheading?: string;
  actions?: ReactNode;
}

export function AppShell({ children, heading, subheading, actions }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/80 bg-card/70 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{heading}</h1>
              {subheading ? (
                <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{subheading}</p>
              ) : null}
            </div>
            {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
    </div>
  );
}
