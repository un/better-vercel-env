import type { ApplyResultData, ProjectEnvSnapshot, VercelProjectSummary, VercelScopeSummary } from "@/lib/types";
import type { EnvMatrixDraft, EnvOperation } from "@/lib/env-model";

export type TuiScreen = "auth" | "picker" | "editor" | "confirm" | "report";

export interface TuiSelection {
  scopeId: string | null;
  projectId: string | null;
}

export interface TuiEditorContext {
  snapshot: ProjectEnvSnapshot | null;
  baseline: EnvMatrixDraft | null;
  draft: EnvMatrixDraft | null;
  pendingOperations: EnvOperation[];
  failedOperationIds: string[];
}

export interface TuiStatusState {
  loading: boolean;
  message: string | null;
  error: string | null;
}

export interface TuiAppState {
  screen: TuiScreen;
  scopes: VercelScopeSummary[];
  projects: VercelProjectSummary[];
  selection: TuiSelection;
  editor: TuiEditorContext;
  applyReport: ApplyResultData | null;
  status: TuiStatusState;
}
