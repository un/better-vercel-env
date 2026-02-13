"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface CliAuthStatusPayload {
  data?: {
    authenticated?: boolean;
    username?: string | null;
    activeScope?: string | null;
    message?: string;
  };
}

export function TokenOnboardingForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState<string | null>(null);
  const [activeScope, setActiveScope] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>("Checking CLI session...");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStatus = async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      setErrorMessage(null);
      const response = await fetch("/api/vercel/auth-status");
      const payload = (await response.json().catch(() => null)) as CliAuthStatusPayload | null;

      if (!response.ok) {
        setAuthenticated(false);
        setStatusMessage("Could not read CLI auth status.");
        setErrorMessage("Unable to read CLI status. Run `vercel login` and retry.");
        return;
      }

      const nextAuthenticated = payload?.data?.authenticated === true;
      setAuthenticated(nextAuthenticated);
      setUsername(payload?.data?.username ?? null);
      setActiveScope(payload?.data?.activeScope ?? null);
      setStatusMessage(payload?.data?.message ?? "CLI auth status loaded.");
    } catch {
      setAuthenticated(false);
      setStatusMessage("Could not read CLI auth status.");
      setErrorMessage("Network error while checking CLI auth status.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        Checking Vercel CLI session...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
        <p className="font-medium text-foreground">Status: {authenticated ? "Authenticated" : "Not authenticated"}</p>
        <p className="mt-1 text-muted-foreground">{statusMessage}</p>
        {username ? <p className="mt-2 text-xs text-muted-foreground">User: {username}</p> : null}
        {activeScope ? <p className="text-xs text-muted-foreground">Active scope: {activeScope}</p> : null}
      </div>

      {errorMessage ? (
        <p className="flex items-center gap-2 text-sm text-destructive" role="status" aria-live="polite">
          <AlertCircle className="size-4" aria-hidden="true" />
          {errorMessage}
        </p>
      ) : null}

      {!authenticated ? (
        <div className="space-y-2 rounded-xl border border-border/70 bg-background p-3 text-sm text-muted-foreground">
          <p>Run these commands in your terminal:</p>
          <p className="rounded-md border border-border bg-muted p-2 font-mono text-xs">vercel login</p>
          <p className="rounded-md border border-border bg-muted p-2 font-mono text-xs">vercel switch</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => void loadStatus(true)} disabled={isRefreshing}>
          {isRefreshing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Refreshing...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <RefreshCw className="size-4" aria-hidden="true" />
              Refresh status
            </span>
          )}
        </Button>
        <Button type="button" onClick={() => router.push("/projects")} disabled={!authenticated}>
          <span className="inline-flex items-center gap-2">
            Continue to projects
          </span>
        </Button>
      </div>
    </div>
  );
}
