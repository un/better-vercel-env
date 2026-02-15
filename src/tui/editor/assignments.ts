import type { EnvMatrixDraft, EnvMatrixRowDraft } from "@/lib/env-model";
import type { EnvironmentId } from "@/lib/types";

export type AssignmentBlockReason =
  | "row_encrypted"
  | "branch_unsupported"
  | "custom_environment_unsupported"
  | "environment_missing"
  | "value_missing";

export interface AssignmentEditResult {
  draft: EnvMatrixDraft;
  updated: boolean;
}

export interface AssignmentPermission {
  allowed: boolean;
  reason: AssignmentBlockReason | null;
}

export function canEditAssignment(
  draft: EnvMatrixDraft,
  row: EnvMatrixRowDraft,
  environmentId: EnvironmentId,
): AssignmentPermission {
  const environment = draft.environments.find((item) => item.id === environmentId);
  if (!environment) {
    return {
      allowed: false,
      reason: "environment_missing",
    };
  }

  if (environment.kind === "custom" && !draft.capabilities.supportsCustomEnvironments) {
    return {
      allowed: false,
      reason: "custom_environment_unsupported",
    };
  }

  if (row.values.some((value) => value.type === "encrypted")) {
    return {
      allowed: false,
      reason: "row_encrypted",
    };
  }

  const hasBranchScopedValue = row.values.some((value) => Boolean(value.gitBranch));
  if (hasBranchScopedValue && !draft.capabilities.supportsBranchSpecificWrites) {
    return {
      allowed: false,
      reason: "branch_unsupported",
    };
  }

  return {
    allowed: true,
    reason: null,
  };
}

export function setRowAssignment(
  draft: EnvMatrixDraft,
  rowId: string,
  environmentId: EnvironmentId,
  valueId: string | null,
): AssignmentEditResult {
  let updated = false;

  const rows = draft.rows.map((row) => {
    if (row.rowId !== rowId) {
      return row;
    }

    if (valueId !== null && !row.values.some((value) => value.id === valueId)) {
      return row;
    }

    if (row.assignments[environmentId] === valueId) {
      return row;
    }

    updated = true;

    return {
      ...row,
      assignments: {
        ...row.assignments,
        [environmentId]: valueId,
      },
    };
  });

  return {
    draft: {
      ...draft,
      rows,
    },
    updated,
  };
}
