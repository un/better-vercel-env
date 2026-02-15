import { describe, expect, it } from "vitest";

import { normalizeSnapshotToDraft } from "../../lib/env-model/normalize";
import type { ProjectEnvSnapshot } from "../../lib/types";

import { undoRowDraftChange } from "./undo";

const snapshot: ProjectEnvSnapshot = {
  projectId: "prj_1",
  baselineHash: "hash",
  capabilities: {
    supportsCustomEnvironments: true,
    supportsBranchSpecificWrites: true,
  },
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
      type: "plain",
      target: ["production"],
      customEnvironmentIds: [],
      comment: null,
      gitBranch: null,
      system: false,
      readOnlyReason: null,
    },
  ],
};

describe("undoRowDraftChange", () => {
  it("restores modified row from baseline", () => {
    const baseline = normalizeSnapshotToDraft(snapshot);
    const draft = structuredClone(baseline);
    draft.rows[0]!.key = "API_KEY_NEW";

    const result = undoRowDraftChange(baseline, draft, "row:API_KEY");
    expect(result.changed).toBe(true);
    expect(result.draft.rows[0]?.key).toBe("API_KEY");
  });

  it("removes draft-only rows", () => {
    const baseline = normalizeSnapshotToDraft(snapshot);
    const draft = structuredClone(baseline);
    draft.rows.push({
      rowId: "row:new:1",
      key: "TEMP",
      values: [],
      assignments: {
        production: null,
        preview: null,
        development: null,
      },
      sourceRows: [],
      isNew: true,
    });

    const result = undoRowDraftChange(baseline, draft, "row:new:1");
    expect(result.changed).toBe(true);
    expect(result.draft.rows.some((row) => row.rowId === "row:new:1")).toBe(false);
  });

  it("is stable when undo repeats without changes", () => {
    const baseline = normalizeSnapshotToDraft(snapshot);
    const draft = structuredClone(baseline);

    const first = undoRowDraftChange(baseline, draft, "row:API_KEY");
    const second = undoRowDraftChange(baseline, first.draft, "row:API_KEY");

    expect(first.changed).toBe(false);
    expect(second.changed).toBe(false);
  });
});
