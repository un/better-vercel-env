import { beforeEach, describe, expect, it } from "vitest";

import type { ProjectEnvSnapshot } from "../types";

import { useEnvDraftStore } from "./draft-store";

const snapshot: ProjectEnvSnapshot = {
  projectId: "prj_1",
  baselineHash: "hash",
  environments: [
    { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
    { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
    { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
  ],
  records: [
    {
      id: "env_1",
      key: "API_KEY",
      value: "alpha",
      type: "plain" as const,
      target: ["production"],
      customEnvironmentIds: [],
      comment: null,
      gitBranch: null,
      system: false,
      readOnlyReason: null,
    },
  ],
};

describe("useEnvDraftStore undo behavior", () => {
  beforeEach(() => {
    useEnvDraftStore.getState().reset();
    useEnvDraftStore.getState().initializeFromSnapshot(structuredClone(snapshot));
  });

  it("undoes sequential changes and clears pending list", () => {
    const state = useEnvDraftStore.getState();
    state.renameRowKey("row:API_KEY", "API_KEY_NEW");

    expect(useEnvDraftStore.getState().pendingChanges.length).toBeGreaterThan(0);

    useEnvDraftStore.getState().undoRowChange("row:API_KEY");
    const row = useEnvDraftStore.getState().draft?.rows[0];

    expect(row?.key).toBe("API_KEY");
    expect(useEnvDraftStore.getState().pendingChanges).toHaveLength(0);
  });

  it("undoes overlapping edits without dangling value references", () => {
    const state = useEnvDraftStore.getState();
    state.addValue("row:API_KEY");

    const valueId = useEnvDraftStore.getState().draft?.rows[0]?.values[1]?.id;
    expect(valueId).toBeTruthy();

    state.editValue("row:API_KEY", valueId!, "beta");
    state.setAssignment("row:API_KEY", "preview", valueId!);
    state.renameRowKey("row:API_KEY", "API_KEY_RENAMED");

    expect(useEnvDraftStore.getState().pendingChanges.length).toBeGreaterThan(1);

    useEnvDraftStore.getState().undoRowChange("row:API_KEY");
    const row = useEnvDraftStore.getState().draft?.rows[0];

    expect(row?.key).toBe("API_KEY");
    expect(row?.values).toHaveLength(1);
    expect(row?.assignments.preview).toBeNull();

    const valueIds = new Set((row?.values ?? []).map((value) => value.id));
    Object.values(row?.assignments ?? {}).forEach((assigned) => {
      expect(assigned === null || valueIds.has(assigned)).toBe(true);
    });
  });

  it("removes a new row when undo targets draft-only row", () => {
    const state = useEnvDraftStore.getState();
    state.addRow("TEMP_KEY");

    const newRow = useEnvDraftStore
      .getState()
      .draft?.rows.find((row) => row.isNew && row.key === "TEMP_KEY");

    expect(newRow).toBeTruthy();

    useEnvDraftStore.getState().undoRowChange(newRow!.rowId);

    expect(
      useEnvDraftStore
        .getState()
        .draft?.rows.some((row) => row.isNew && row.key === "TEMP_KEY"),
    ).toBe(false);
  });
});
