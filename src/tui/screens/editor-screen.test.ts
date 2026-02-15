import { describe, expect, it } from "vitest";

import type { EnvMatrixDraft } from "@/lib/env-model";

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
            content: "one",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [],
          },
        ],
        assignments: {
          production: "value-1",
          preview: "value-1",
          development: null,
        },
        sourceRows: [],
        isNew: false,
      },
    ],
    sourceRowIndex: {},
    capabilities: {
      supportsCustomEnvironments: false,
      supportsBranchSpecificWrites: false,
    },
    baselineHash: "hash",
  };
}

describe("editor screen model", () => {
  it("creates draft fixture with built-in assignment structure", () => {
    const draft = makeDraft();
    expect(draft.rows[0]?.assignments.production).toBe("value-1");
    expect(draft.rows[0]?.assignments.development).toBeNull();
  });
});
