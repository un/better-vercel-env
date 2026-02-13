import type { EnvOperation } from "@/lib/env-model";
import type { BuiltInEnvironmentId } from "@/lib/types";

type CliApplyActionKind = "add" | "remove" | "skip";

export interface CliApplyAction {
  operationId: string;
  actionKind: CliApplyActionKind;
  key: string | null;
  environment: BuiltInEnvironmentId | null;
  value: string | null;
  reason: string | null;
}

function toDeterministicOrder(left: CliApplyAction, right: CliApplyAction): number {
  const actionOrder: Record<CliApplyActionKind, number> = {
    add: 0,
    remove: 1,
    skip: 2,
  };

  return (
    actionOrder[left.actionKind] - actionOrder[right.actionKind] ||
    (left.key ?? "").localeCompare(right.key ?? "") ||
    (left.environment ?? "").localeCompare(right.environment ?? "") ||
    left.operationId.localeCompare(right.operationId)
  );
}

function mapSetLikeOperation(operation: EnvOperation): CliApplyAction[] {
  const after = operation.after;
  if (!after || typeof after.value !== "string") {
    return [
      {
        operationId: operation.id,
        actionKind: "skip",
        key: after?.key ?? null,
        environment: null,
        value: null,
        reason: "missing_after_value",
      },
    ];
  }

  if ((after.customEnvironmentIds?.length ?? 0) > 0) {
    return [
      {
        operationId: operation.id,
        actionKind: "skip",
        key: after.key,
        environment: null,
        value: null,
        reason: "unsupported_custom_environment",
      },
    ];
  }

  if (!after.target || after.target.length === 0) {
    return [
      {
        operationId: operation.id,
        actionKind: "skip",
        key: after.key,
        environment: null,
        value: null,
        reason: "missing_target_environment",
      },
    ];
  }

  return after.target.map((environment) => ({
    operationId: operation.id,
    actionKind: "add",
    key: after.key,
    environment,
    value: after.value ?? "",
    reason: null,
  }));
}

function mapDeleteOperation(operation: EnvOperation): CliApplyAction[] {
  const before = operation.before;
  if (!before) {
    return [
      {
        operationId: operation.id,
        actionKind: "skip",
        key: null,
        environment: null,
        value: null,
        reason: "missing_before_snapshot",
      },
    ];
  }

  if ((before.customEnvironmentIds?.length ?? 0) > 0) {
    return [
      {
        operationId: operation.id,
        actionKind: "skip",
        key: before.key,
        environment: null,
        value: null,
        reason: "unsupported_custom_environment",
      },
    ];
  }

  if (!before.target || before.target.length === 0) {
    return [
      {
        operationId: operation.id,
        actionKind: "skip",
        key: before.key,
        environment: null,
        value: null,
        reason: "missing_target_environment",
      },
    ];
  }

  return before.target.map((environment) => ({
    operationId: operation.id,
    actionKind: "remove",
    key: before.key,
    environment,
    value: null,
    reason: null,
  }));
}

export function buildCliApplyActions(operations: EnvOperation[]): CliApplyAction[] {
  const actions: CliApplyAction[] = operations.flatMap((operation): CliApplyAction[] => {
    if (operation.kind === "create_env" || operation.kind === "update_env") {
      return mapSetLikeOperation(operation);
    }

    if (operation.kind === "delete_env") {
      return mapDeleteOperation(operation);
    }

    const skippedAction: CliApplyAction = {
      operationId: operation.id,
      actionKind: "skip",
      key: operation.after?.key ?? operation.before?.key ?? null,
      environment: null,
      value: null,
      reason: "unsupported_operation_kind",
    };

    return [skippedAction];
  });

  return actions.sort(toDeterministicOrder);
}
