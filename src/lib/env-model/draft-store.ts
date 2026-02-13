import { create } from "zustand";

import type { ProjectEnvSnapshot } from "@/lib/types";

import { normalizeSnapshotToDraft } from "./normalize";
import type { EnvMatrixChange, EnvMatrixDraft } from "./types";

interface EnvDraftState {
  baseline: EnvMatrixDraft | null;
  draft: EnvMatrixDraft | null;
  pendingChanges: EnvMatrixChange[];
  initializeFromSnapshot: (snapshot: ProjectEnvSnapshot) => void;
  setDraft: (nextDraft: EnvMatrixDraft) => void;
  setPendingChanges: (changes: EnvMatrixChange[]) => void;
  reset: () => void;
}

export const useEnvDraftStore = create<EnvDraftState>((set) => ({
  baseline: null,
  draft: null,
  pendingChanges: [],
  initializeFromSnapshot: (snapshot) => {
    const normalized = normalizeSnapshotToDraft(snapshot);
    set({
      baseline: normalized,
      draft: structuredClone(normalized),
      pendingChanges: [],
    });
  },
  setDraft: (nextDraft) => {
    set({ draft: nextDraft });
  },
  setPendingChanges: (changes) => {
    set({ pendingChanges: changes });
  },
  reset: () => {
    set({
      baseline: null,
      draft: null,
      pendingChanges: [],
    });
  },
}));
