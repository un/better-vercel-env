import { describe, expect, it } from "vitest";

import type { EnvMatrixDraft } from "@/lib/env-model";

import { addValueToDraft, editValueInDraft, removeValueFromDraft } from "./value-pool";

function makeDraft(): EnvMatrixDraft {
  return {
    projectId: "prj_1",
    environments: [
      { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
      { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
      { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
    ],
    rows: [
      {
        rowId: "row:API_KEY",
        key: "API_KEY",
        values: [
          {
            id: "value-1",
            content: "alpha",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [],
          },
          {
            id: "value-3",
            content: "beta",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [],
          },
        ],
        assignments: {
          production: "value-1",
          preview: null,
          development: null,
        },
        sourceRows: [],
        isNew: false,
      },
    ],
    sourceRowIndex: {},
    capabilities: {
      supportsCustomEnvironments: true,
      supportsBranchSpecificWrites: true,
    },
    baselineHash: "hash",
  };
}

describe("value pool editor helpers", () => {
  it("adds a new value using the next numeric value id", () => {
    const result = addValueToDraft(makeDraft(), "row:API_KEY");
    expect(result.addedValueId).toBe("value-4");
    expect(result.draft.rows[0]?.values.map((item) => item.id)).toEqual(["value-1", "value-3", "value-4"]);
  });

  it("edits selected value content", () => {
    const result = editValueInDraft(makeDraft(), "row:API_KEY", "value-3", "gamma");
    expect(result.updated).toBe(true);
    expect(result.draft.rows[0]?.values[1]?.content).toBe("gamma");
  });

  it("blocks deletion of assigned values", () => {
    const result = removeValueFromDraft(makeDraft(), "row:API_KEY", "value-1");
    expect(result.removed).toBe(false);
    expect(result.reason).toBe("assigned");
    expect(result.draft.rows[0]?.values).toHaveLength(2);
  });

  it("removes unassigned values", () => {
    const result = removeValueFromDraft(makeDraft(), "row:API_KEY", "value-3");
    expect(result.removed).toBe(true);
    expect(result.reason).toBeNull();
    expect(result.draft.rows[0]?.values.map((item) => item.id)).toEqual(["value-1"]);
  });
});
