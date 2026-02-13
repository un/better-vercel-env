"use client";

import { useMemo } from "react";

import { planOperations, useEnvDraftStore } from "@/lib/env-model";

function kindClass(kind: string): string {
  if (kind === "create_env") {
    return "status-create";
  }

  if (kind === "delete_env") {
    return "status-delete";
  }

  if (kind === "update_env" || kind === "retarget" || kind === "rename_key") {
    return "status-update";
  }

  return "status-unchanged";
}

export function ChangeOrderPanel() {
  const baseline = useEnvDraftStore((state) => state.baseline);
  const draft = useEnvDraftStore((state) => state.draft);

  const operations = useMemo(() => {
    if (!baseline || !draft) {
      return [];
    }

    return planOperations(baseline, draft).operations;
  }, [baseline, draft]);

  if (operations.length === 0) {
    return <p className="text-sm text-muted-foreground">No pending changes.</p>;
  }

  return (
    <div className="space-y-2">
      {operations.map((operation) => (
        <div key={operation.id} className="rounded-md border border-border p-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${kindClass(operation.kind)}`}>
              {operation.kind}
            </span>
          </div>
          <p className="mt-2 text-sm">{operation.summary}</p>
        </div>
      ))}
    </div>
  );
}
