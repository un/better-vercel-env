import type { BuiltInEnvironmentId } from "@/lib/types";

export type OperationKind = "create_env" | "update_env" | "delete_env" | "rename_key" | "retarget";

export interface OperationSnapshot {
  rowId: string;
  key: string;
  value?: string;
  target?: BuiltInEnvironmentId[];
  customEnvironmentIds?: string[];
}

export interface EnvOperation {
  id: string;
  kind: OperationKind;
  summary: string;
  rowId: string;
  before: OperationSnapshot | null;
  after: OperationSnapshot | null;
  undoToken: string;
}

export interface PlannedOperations {
  operations: EnvOperation[];
}
