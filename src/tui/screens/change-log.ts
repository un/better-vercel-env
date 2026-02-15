import type { EnvOperation } from "@/lib/env-model";

function operationBadge(kind: EnvOperation["kind"]): string {
  if (kind === "create_env") {
    return "CRT";
  }

  if (kind === "update_env") {
    return "UPD";
  }

  if (kind === "delete_env") {
    return "DEL";
  }

  if (kind === "rename_key") {
    return "REN";
  }

  return "RTG";
}

export function formatChangeLogLines(operations: EnvOperation[]): string[] {
  if (operations.length === 0) {
    return ["No pending operations."];
  }

  return [...operations]
    .reverse()
    .map((operation) => `[${operationBadge(operation.kind)}] ${operation.summary}`);
}
