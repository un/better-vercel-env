import { describe, expect, it } from "vitest";

import type { EnvMatrixDraft } from "@/lib/env-model";

import { canEditAssignment, setRowAssignment } from "./assignments";

function makeDraft(overrides?: Partial<EnvMatrixDraft>): EnvMatrixDraft {
  const base: EnvMatrixDraft = {
    projectId: "prj_1",
    environments: [
      { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
      { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
      { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
      { id: "custom:ce_stage", name: "Stage", kind: "custom", customEnvironmentId: "ce_stage" },
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
        ],
        assignments: {
          production: "value-1",
          preview: null,
          development: null,
          "custom:ce_stage": null,
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

  return {
    ...base,
    ...overrides,
  };
}

describe("assignment editor helpers", () => {
  it("updates assignment to selected value", () => {
    const draft = makeDraft();
    const result = setRowAssignment(draft, "row:API_KEY", "custom:ce_stage", "value-1");
    expect(result.updated).toBe(true);
    expect(result.draft.rows[0]?.assignments["custom:ce_stage"]).toBe("value-1");
  });

  it("supports unsetting assignment", () => {
    const draft = makeDraft();
    const result = setRowAssignment(draft, "row:API_KEY", "production", null);
    expect(result.updated).toBe(true);
    expect(result.draft.rows[0]?.assignments.production).toBeNull();
  });

  it("blocks custom assignment when capability is off", () => {
    const draft = makeDraft({
      capabilities: {
        supportsCustomEnvironments: false,
        supportsBranchSpecificWrites: true,
      },
    });

    const row = draft.rows[0];
    expect(row).toBeTruthy();
    const permission = canEditAssignment(draft, row!, "custom:ce_stage");
    expect(permission.allowed).toBe(false);
    expect(permission.reason).toBe("custom_environment_unsupported");
  });

  it("blocks assignment when branch-specific writes are unsupported", () => {
    const draft = makeDraft({
      capabilities: {
        supportsCustomEnvironments: true,
        supportsBranchSpecificWrites: false,
      },
      rows: [
        {
          ...makeDraft().rows[0],
          values: [
            {
              id: "value-1",
              content: "alpha",
              type: "plain",
              comment: null,
              gitBranch: "feature/x",
              readOnlyReason: null,
              sourceRows: [],
            },
          ],
        },
      ],
    });

    const row = draft.rows[0];
    expect(row).toBeTruthy();
    const permission = canEditAssignment(draft, row!, "production");
    expect(permission.allowed).toBe(false);
    expect(permission.reason).toBe("branch_unsupported");
  });
});
