import { planOperations } from "../../lib/env-model/planner";
import type { EnvMatrixDraft, EnvOperation } from "../../lib/env-model";

export function computePendingOperations(baseline: EnvMatrixDraft | null, draft: EnvMatrixDraft | null): EnvOperation[] {
  if (!baseline || !draft) {
    return [];
  }

  return planOperations(baseline, draft).operations;
}
