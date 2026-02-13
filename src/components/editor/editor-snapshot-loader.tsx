"use client";

import { useEffect, useState } from "react";

import { ChangeOrderPanel } from "@/components/editor/change-order-panel";
import { EnvMatrixTableShell } from "@/components/editor/env-matrix-table-shell";
import { ResponsivePanelLayout } from "@/components/responsive-panel-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEnvDraftStore, type EnvOperation } from "@/lib/env-model";
import type { ApiResponse, ApplyResultData, ProjectEnvSnapshot } from "@/lib/types";

interface SnapshotResponse {
  data?: ProjectEnvSnapshot;
  error?: {
    message?: string;
  };
}

type ApplyResponse = ApiResponse<ApplyResultData>;

interface EditorSnapshotLoaderProps {
  projectId: string;
  scopeId: string;
}

export function EditorSnapshotLoader({ projectId, scopeId }: EditorSnapshotLoaderProps) {
  const initializeFromSnapshot = useEnvDraftStore((state) => state.initializeFromSnapshot);
  const draft = useEnvDraftStore((state) => state.draft);
  const [snapshot, setSnapshot] = useState<ProjectEnvSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [applyReport, setApplyReport] = useState<ApplyResultData | null>(null);
  const [applyMessage, setApplyMessage] = useState<string | null>(null);
  const [failedOperationIds, setFailedOperationIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const loadSnapshot = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const params = new URLSearchParams({ projectId, scopeId });
        const response = await fetch(`/api/vercel/project-snapshot?${params.toString()}`);
        const payload = (await response.json().catch(() => null)) as SnapshotResponse | null;

        if (!response.ok) {
          setErrorMessage(payload?.error?.message ?? "Unable to load project snapshot.");
          setSnapshot(null);
          return;
        }

        const nextSnapshot = payload?.data ?? null;
        setSnapshot(nextSnapshot);

        if (nextSnapshot) {
          initializeFromSnapshot(nextSnapshot);
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadSnapshot();
  }, [projectId, scopeId, refreshKey, initializeFromSnapshot]);

  const handleApply = async (operations: EnvOperation[]): Promise<void> => {
    if (isApplying || operations.length === 0) {
      return;
    }

    const baselineHash = draft?.baselineHash ?? snapshot?.baselineHash;
    if (!baselineHash) {
      setApplyMessage("Cannot apply without baseline hash. Reload snapshot and try again.");
      return;
    }

    setIsApplying(true);
    setApplyMessage(null);

    try {
      const response = await fetch("/api/vercel/apply", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          scopeId,
          baselineHash,
          operations,
        }),
      });

      const payload = (await response.json().catch(() => null)) as ApplyResponse | null;

      if (!response.ok || !payload || !payload.ok) {
        setApplyMessage(payload && !payload.ok ? payload.error.message : "Unable to apply changes.");
        return;
      }

      const nextReport = payload.data;
      setApplyReport(nextReport);

      const failedIds = nextReport.results
        .filter((item) => item.status === "failed")
        .map((item) => item.operationId);

      if (failedIds.length > 0) {
        setFailedOperationIds(new Set(failedIds));
        setApplyMessage("Some operations failed. Review the report and retry failed items.");
        return;
      }

      setFailedOperationIds(null);
      setApplyMessage("Changes applied successfully. Snapshot refreshed.");
      setRefreshKey((value) => value + 1);
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-md bg-muted" />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
        <p>{errorMessage}</p>
        <Button
          className="mt-3"
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRefreshKey((value) => value + 1)}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!snapshot) {
    return <p className="text-sm text-muted-foreground">No snapshot data available.</p>;
  }

  return (
    <ResponsivePanelLayout
      panelTitle="Change order"
      panelDescription="Operations update live as you edit."
      main={
        <div className="space-y-2 rounded-lg border border-border bg-card p-4">
          <h2 className="text-lg font-medium">Snapshot loaded</h2>
          <p className="text-sm text-muted-foreground">Project ID: {snapshot.projectId}</p>
          <p className="text-sm text-muted-foreground">Environment columns: {snapshot.environments.length}</p>
          <p className="text-sm text-muted-foreground">Env records: {snapshot.records.length}</p>
          <p className="text-xs text-muted-foreground">Baseline hash: {snapshot.baselineHash}</p>
          {isApplying ? (
            <p className="rounded-md border border-border bg-muted p-2 text-sm text-muted-foreground">
              Applying operations. Editing is temporarily disabled.
            </p>
          ) : null}
          {applyMessage ? (
            <p className="rounded-md border border-border bg-muted p-2 text-sm text-muted-foreground">{applyMessage}</p>
          ) : null}
          <EnvMatrixTableShell disabled={isApplying} />
          {applyReport ? (
            <section className="space-y-2 rounded-md border border-border p-3" aria-live="polite">
              <h3 className="text-sm font-semibold">Last apply report</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="status-create">
                  Done {applyReport.results.filter((item) => item.status === "done").length}
                </Badge>
                <Badge variant="outline" className="status-delete">
                  Failed {applyReport.results.filter((item) => item.status === "failed").length}
                </Badge>
                <Badge variant="outline" className="status-update">
                  Skipped {applyReport.results.filter((item) => item.status === "skipped").length}
                </Badge>
              </div>
              {(["failed", "done", "skipped"] as const).map((status) => {
                const items = applyReport.results.filter((item) => item.status === status);
                if (items.length === 0) {
                  return null;
                }

                return (
                  <div key={status} className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status}</p>
                    {items.map((item) => (
                      <div key={item.operationId} className="rounded-md border border-border p-2 text-xs">
                        <p className="font-medium">{item.operationId}</p>
                        {item.message ? <p className="mt-1 text-muted-foreground">{item.message}</p> : null}
                        {item.createdId ? <p className="mt-1 text-muted-foreground">Created ID: {item.createdId}</p> : null}
                      </div>
                    ))}
                  </div>
                );
              })}
            </section>
          ) : null}
        </div>
      }
      panel={
        <ChangeOrderPanel
          isApplying={isApplying}
          failedOperationIds={failedOperationIds}
          onApply={handleApply}
        />
      }
    />
  );
}
