"use client";

import { useEffect, useState } from "react";

import { EnvMatrixTableShell } from "@/components/editor/env-matrix-table-shell";
import { Button } from "@/components/ui/button";
import { useEnvDraftStore } from "@/lib/env-model";
import type { ProjectEnvSnapshot } from "@/lib/types";

interface SnapshotResponse {
  data?: ProjectEnvSnapshot;
  error?: {
    message?: string;
  };
}

interface EditorSnapshotLoaderProps {
  projectId: string;
  scopeId: string;
}

export function EditorSnapshotLoader({ projectId, scopeId }: EditorSnapshotLoaderProps) {
  const initializeFromSnapshot = useEnvDraftStore((state) => state.initializeFromSnapshot);
  const [snapshot, setSnapshot] = useState<ProjectEnvSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
    <div className="space-y-2 rounded-lg border border-border bg-card p-4">
      <h2 className="text-lg font-medium">Snapshot loaded</h2>
      <p className="text-sm text-muted-foreground">Project ID: {snapshot.projectId}</p>
      <p className="text-sm text-muted-foreground">Environment columns: {snapshot.environments.length}</p>
      <p className="text-sm text-muted-foreground">Env records: {snapshot.records.length}</p>
      <p className="text-xs text-muted-foreground">Baseline hash: {snapshot.baselineHash}</p>
      <EnvMatrixTableShell />
    </div>
  );
}
