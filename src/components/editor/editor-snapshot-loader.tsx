"use client";

import { useEffect, useState } from "react";

import { ChangeOrderPanel } from "@/components/editor/change-order-panel";
import { EnvMatrixTableShell } from "@/components/editor/env-matrix-table-shell";
import { ResponsivePanelLayout } from "@/components/responsive-panel-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  const doneCount = applyReport?.results.filter((item) => item.status === "done").length ?? 0;
  const failedCount = applyReport?.results.filter((item) => item.status === "failed").length ?? 0;
  const skippedCount = applyReport?.results.filter((item) => item.status === "skipped").length ?? 0;
  const encryptedRecordCount = snapshot.records.filter((record) => record.type === "encrypted").length;
  const supportsCustomEnvironments = snapshot.capabilities.supportsCustomEnvironments;
  const supportsBranchSpecificWrites = snapshot.capabilities.supportsBranchSpecificWrites;
  const messageToneClass = applyMessage?.toLowerCase().includes("success")
    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
    : applyMessage?.toLowerCase().includes("failed")
      ? "border-destructive/40 bg-destructive/10 text-destructive"
      : "border-border bg-muted text-muted-foreground";

  return (
    <ResponsivePanelLayout
      panelTitle="Change order"
      panelDescription="Operations update live as you edit."
      main={
        <div className="space-y-3 rounded-2xl border border-border/70 bg-card/90 p-4 shadow-[0_12px_28px_-20px_rgba(15,23,42,0.3)] sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full px-2.5 py-1">Snapshot loaded</Badge>
            <Badge variant="outline" className="rounded-full px-2.5 py-1">
              Project {snapshot.projectId}
            </Badge>
          </div>
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="rounded-lg border border-border/70 bg-background px-3 py-2">
              Environment columns: {snapshot.environments.length}
            </p>
            <p className="rounded-lg border border-border/70 bg-background px-3 py-2">Env records: {snapshot.records.length}</p>
            <p className="rounded-lg border border-border/70 bg-background px-3 py-2">
              Custom env writes: {supportsCustomEnvironments ? "supported" : "not supported"}
            </p>
            <p className="rounded-lg border border-border/70 bg-background px-3 py-2">
              Branch writes: {supportsBranchSpecificWrites ? "supported" : "not supported"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground">Baseline hash: {snapshot.baselineHash}</p>
          {encryptedRecordCount > 0 ? (
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800">
              {encryptedRecordCount} value{encryptedRecordCount === 1 ? " is" : "s are"} protected by Vercel and not
              decryptable via this API response. You can still rotate them by typing a new value.
            </p>
          ) : null}
          {isApplying ? (
            <p className="rounded-lg border border-sky-200 bg-sky-50 p-2 text-sm text-sky-800">
              Applying operations. Editing is temporarily disabled.
            </p>
          ) : null}
          {applyMessage ? (
            <p className={cn("rounded-lg border p-2 text-sm", messageToneClass)}>{applyMessage}</p>
          ) : null}
          <EnvMatrixTableShell disabled={isApplying} />
          {applyReport ? (
            <section className="space-y-2 rounded-xl border border-border/70 bg-muted/20 p-3" aria-live="polite">
              <h3 className="text-sm font-semibold">Last apply report</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="status-create">
                  Done {doneCount}
                </Badge>
                <Badge variant="outline" className="status-delete">
                  Failed {failedCount}
                </Badge>
                <Badge variant="outline" className="status-update">
                  Skipped {skippedCount}
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
