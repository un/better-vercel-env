import { create } from "zustand";

import type { ProjectEnvSnapshot } from "@/lib/types";

import { normalizeSnapshotToDraft } from "./normalize";
import type { EnvMatrixChange, EnvMatrixDraft } from "./types";
import type { EnvironmentId } from "@/lib/types";

interface EnvDraftState {
  baseline: EnvMatrixDraft | null;
  draft: EnvMatrixDraft | null;
  pendingChanges: EnvMatrixChange[];
  initializeFromSnapshot: (snapshot: ProjectEnvSnapshot) => void;
  setDraft: (nextDraft: EnvMatrixDraft) => void;
  setPendingChanges: (changes: EnvMatrixChange[]) => void;
  addRow: (key?: string) => void;
  removeRow: (rowId: string) => void;
  renameRowKey: (rowId: string, key: string) => void;
  addValue: (rowId: string) => void;
  editValue: (rowId: string, valueId: string, content: string) => void;
  removeValue: (rowId: string, valueId: string) => void;
  setAssignment: (rowId: string, environmentId: EnvironmentId, valueId: string | null) => void;
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
  addRow: (key = "") => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const assignments = state.draft.environments.reduce<EnvMatrixDraft["rows"][number]["assignments"]>(
        (result, environment) => {
          result[environment.id] = null;
          return result;
        },
        {} as EnvMatrixDraft["rows"][number]["assignments"],
      );

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: [
            ...state.draft.rows,
            {
              rowId: `row:new:${crypto.randomUUID()}`,
              key,
              values: [],
              assignments,
              sourceRows: [],
              isNew: true,
            },
          ],
        },
      };
    });
  },
  removeRow: (rowId) => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      const row = state.draft.rows.find((item) => item.rowId === rowId);

      if (!row || !row.isNew) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: state.draft.rows.filter((item) => item.rowId !== rowId),
        },
      };
    });
  },
  renameRowKey: (rowId, key) => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: state.draft.rows.map((row) =>
            row.rowId === rowId
              ? {
                  ...row,
                  key,
                }
              : row,
          ),
        },
      };
    });
  },
  addValue: (rowId) => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: state.draft.rows.map((row) => {
            if (row.rowId !== rowId) {
              return row;
            }

            return {
              ...row,
              values: [
                ...row.values,
                {
                  id: `value-${row.values.length + 1}`,
                  content: "",
                  type: "plain",
                  comment: null,
                  gitBranch: null,
                  readOnlyReason: null,
                  sourceRows: [],
                },
              ],
            };
          }),
        },
      };
    });
  },
  editValue: (rowId, valueId, content) => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: state.draft.rows.map((row) => {
            if (row.rowId !== rowId) {
              return row;
            }

            return {
              ...row,
              values: row.values.map((value) =>
                value.id === valueId
                  ? {
                      ...value,
                      content,
                    }
                  : value,
              ),
            };
          }),
        },
      };
    });
  },
  removeValue: (rowId, valueId) => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: state.draft.rows.map((row) => {
            if (row.rowId !== rowId) {
              return row;
            }

            const hasAssignment = Object.values(row.assignments).includes(valueId);
            if (hasAssignment) {
              return row;
            }

            return {
              ...row,
              values: row.values.filter((value) => value.id !== valueId),
            };
          }),
        },
      };
    });
  },
  setAssignment: (rowId, environmentId, valueId) => {
    set((state) => {
      if (!state.draft) {
        return state;
      }

      return {
        ...state,
        draft: {
          ...state.draft,
          rows: state.draft.rows.map((row) => {
            if (row.rowId !== rowId) {
              return row;
            }

            if (valueId !== null && !row.values.some((value) => value.id === valueId)) {
              return row;
            }

            return {
              ...row,
              assignments: {
                ...row.assignments,
                [environmentId]: valueId,
              },
            };
          }),
        },
      };
    });
  },
  reset: () => {
    set({
      baseline: null,
      draft: null,
      pendingChanges: [],
    });
  },
}));
