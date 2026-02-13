import type { EnvironmentColumn, EnvironmentId, RawVercelEnvRecord } from "@/lib/types";

export interface ValueSourceRef {
  rowId: string;
}

export interface ValuePoolEntry {
  id: string;
  content: string;
  type: "plain" | "encrypted";
  comment: string | null;
  gitBranch: string | null;
  readOnlyReason: "system" | "git_branch" | null;
  sourceRows: ValueSourceRef[];
}

export type EnvironmentAssignments = Record<EnvironmentId, string | null>;

export interface EnvMatrixRowDraft {
  rowId: string;
  key: string;
  values: ValuePoolEntry[];
  assignments: EnvironmentAssignments;
  sourceRows: RawVercelEnvRecord[];
  isNew: boolean;
}

export interface EnvMatrixDraft {
  projectId: string;
  environments: EnvironmentColumn[];
  rows: EnvMatrixRowDraft[];
  baselineHash: string;
}

export interface EnvMatrixChange {
  changeId: string;
  kind: "create" | "update" | "delete" | "rename" | "retarget";
  rowId: string;
  summary: string;
}
