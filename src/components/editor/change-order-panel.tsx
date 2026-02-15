"use client";

import { useMemo, useState } from "react";

import { APPLY_CONFIRM_PHRASE, isApplyConfirmPhraseValid } from "@/components/editor/confirm-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { planOperations, useEnvDraftStore, type EnvOperation } from "@/lib/env-model";

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

interface ChangeOrderPanelProps {
  isApplying: boolean;
  failedOperationIds: Set<string> | null;
  onApply: (operations: EnvOperation[]) => Promise<void>;
}

export function ChangeOrderPanel({ isApplying, failedOperationIds, onApply }: ChangeOrderPanelProps) {
  const baseline = useEnvDraftStore((state) => state.baseline);
  const draft = useEnvDraftStore((state) => state.draft);
  const undoRowChange = useEnvDraftStore((state) => state.undoRowChange);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmPhrase, setConfirmPhrase] = useState("");

  const operations = useMemo<EnvOperation[]>(() => {
    if (!baseline || !draft) {
      return [];
    }

    const nextOperations = planOperations(baseline, draft).operations;

    if (!failedOperationIds || failedOperationIds.size === 0) {
      return nextOperations;
    }

    const failedOnly = nextOperations.filter((operation) => failedOperationIds.has(operation.id));
    return failedOnly.length > 0 ? failedOnly : nextOperations;
  }, [baseline, draft, failedOperationIds]);

  const displayedOperations = useMemo(() => [...operations].reverse(), [operations]);

  const operationCounts = useMemo(() => {
    return operations.reduce(
      (result, operation) => {
        if (operation.kind === "create_env") {
          result.create += 1;
          return result;
        }

        if (operation.kind === "delete_env") {
          result.delete += 1;
          return result;
        }

        result.update += 1;
        return result;
      },
      { create: 0, update: 0, delete: 0 },
    );
  }, [operations]);

  const isConfirmPhraseValid = isApplyConfirmPhraseValid(confirmPhrase);

  const resetConfirmDialog = () => {
    setConfirmPhrase("");
    setIsConfirmOpen(false);
  };

  const handleApply = async () => {
    if (!isConfirmPhraseValid || isApplying || operations.length === 0) {
      return;
    }

    await onApply(operations);
    resetConfirmDialog();
  };

  if (operations.length === 0) {
    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Change log</p>
        <p className="text-sm text-muted-foreground">No pending changes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Change log</p>
        <p className="text-xs text-muted-foreground">Latest first</p>
      </div>
      {failedOperationIds && failedOperationIds.size > 0 ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">
          Showing previously failed operations. Fix values and retry apply.
        </p>
      ) : null}
      {displayedOperations.map((operation) => (
        <div key={operation.id} className="rounded-md border border-border p-2">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${kindClass(operation.kind)}`}>
              {operation.kind}
            </span>
          </div>
          <p className="mt-2 text-sm">{operation.summary}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 h-7 px-2 text-xs"
            onClick={() => undoRowChange(operation.rowId)}
            disabled={isApplying}
          >
            Undo
          </Button>
        </div>
      ))}
      <Dialog
        open={isConfirmOpen}
        onOpenChange={(open) => {
          setIsConfirmOpen(open);
          if (!open) {
            setConfirmPhrase("");
          }
        }}
      >
        <DialogTrigger asChild>
          <Button type="button" className="w-full" disabled={isApplying}>
            {isApplying ? "Applying changes..." : "Apply pending changes"}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm apply</DialogTitle>
            <DialogDescription>
              Type the exact phrase below before applying planned operations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="status-create" variant="outline">
                Create {operationCounts.create}
              </Badge>
              <Badge className="status-update" variant="outline">
                Update {operationCounts.update}
              </Badge>
              <Badge className="status-delete" variant="outline">
                Delete {operationCounts.delete}
              </Badge>
            </div>
            <p className="rounded-md border border-border bg-muted p-2 font-mono text-xs">{APPLY_CONFIRM_PHRASE}</p>
            <Input
              value={confirmPhrase}
              onChange={(event) => setConfirmPhrase(event.target.value)}
              placeholder="Type confirmation phrase"
              aria-label="Confirmation phrase"
              disabled={isApplying}
            />
          </div>
          <DialogFooter showCloseButton>
            <Button
              type="button"
              disabled={!isConfirmPhraseValid || isApplying || operations.length === 0}
              onClick={handleApply}
            >
              {isApplying ? "Applying..." : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
