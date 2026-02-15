import { describe, expect, it } from "vitest";

import { planOperations } from "./planner";
import type { EnvMatrixDraft } from "./types";

function createBaseDraft(rows: EnvMatrixDraft["rows"]): EnvMatrixDraft {
  const sourceRowIndex = rows.flatMap((row) => row.sourceRows).reduce<Record<string, EnvMatrixDraft["rows"][number]["sourceRows"][number]>>(
    (result, sourceRow) => {
      result[sourceRow.id] = sourceRow;
      return result;
    },
    {},
  );

  return {
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
    rows,
    sourceRowIndex,
  };
}

describe("planOperations", () => {
  it("returns no operations when one value spans multiple built-in environments", () => {
    const baseline = createBaseDraft([
      {
        rowId: "row:IN_ALL",
        key: "IN_ALL",
        values: [
          {
            id: "value-1",
            content: "shared",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [{ rowId: "cli:prod:1" }, { rowId: "cli:prev:1" }, { rowId: "cli:dev:1" }],
          },
        ],
        assignments: {
          production: "value-1",
          preview: "value-1",
          development: "value-1",
        },
        sourceRows: [
          {
            id: "cli:prod:1",
            key: "IN_ALL",
            value: "shared",
            type: "plain",
            target: ["production"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
          {
            id: "cli:prev:1",
            key: "IN_ALL",
            value: "shared",
            type: "plain",
            target: ["preview"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
          {
            id: "cli:dev:1",
            key: "IN_ALL",
            value: "shared",
            type: "plain",
            target: ["development"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
        ],
        isNew: false,
      },
    ]);

    const draft = structuredClone(baseline);

    expect(planOperations(baseline, draft).operations).toHaveLength(0);
  });

  it("returns no operations for unchanged draft", () => {
    const baseline = createBaseDraft([
      {
        rowId: "row:API_KEY",
        key: "API_KEY",
        values: [
          {
            id: "value-1",
            content: "abc",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [{ rowId: "env_1" }],
          },
        ],
        assignments: {
          production: "value-1",
          preview: null,
          development: null,
        },
        sourceRows: [
          {
            id: "env_1",
            key: "API_KEY",
            value: "abc",
            type: "plain",
            target: ["production"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
        ],
        isNew: false,
      },
    ]);

    const draft = structuredClone(baseline);

    expect(planOperations(baseline, draft).operations).toHaveLength(0);
  });

  it("creates one operation for each isolated create/update/delete change", () => {
    const baseline = createBaseDraft([
      {
        rowId: "row:UPDATE_ME",
        key: "UPDATE_ME",
        values: [
          {
            id: "value-1",
            content: "old",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [{ rowId: "env_update" }],
          },
        ],
        assignments: {
          production: "value-1",
          preview: null,
          development: null,
        },
        sourceRows: [
          {
            id: "env_update",
            key: "UPDATE_ME",
            value: "old",
            type: "plain",
            target: ["production"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
        ],
        isNew: false,
      },
      {
        rowId: "row:DELETE_ME",
        key: "DELETE_ME",
        values: [
          {
            id: "value-1",
            content: "gone",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [{ rowId: "env_delete" }],
          },
        ],
        assignments: {
          production: "value-1",
          preview: null,
          development: null,
        },
        sourceRows: [
          {
            id: "env_delete",
            key: "DELETE_ME",
            value: "gone",
            type: "plain",
            target: ["production"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
        ],
        isNew: false,
      },
    ]);

    const draft = createBaseDraft([
      {
        rowId: "row:UPDATE_ME",
        key: "UPDATE_ME",
        values: [
          {
            id: "value-1",
            content: "new",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [{ rowId: "env_update" }],
          },
        ],
        assignments: {
          production: "value-1",
          preview: null,
          development: null,
        },
        sourceRows: [
          {
            id: "env_update",
            key: "UPDATE_ME",
            value: "old",
            type: "plain",
            target: ["production"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
        ],
        isNew: false,
      },
      {
        rowId: "row:DELETE_ME",
        key: "DELETE_ME",
        values: [
          {
            id: "value-1",
            content: "gone",
            type: "plain",
            comment: null,
            gitBranch: null,
            readOnlyReason: null,
            sourceRows: [{ rowId: "env_delete" }],
          },
        ],
        assignments: {
          production: null,
          preview: null,
          development: null,
        },
        sourceRows: [
          {
            id: "env_delete",
            key: "DELETE_ME",
            value: "gone",
            type: "plain",
            target: ["production"],
            customEnvironmentIds: [],
            comment: null,
            gitBranch: null,
            system: false,
            readOnlyReason: null,
          },
        ],
        isNew: false,
      },
      {
        rowId: "row:new:1",
        key: "CREATE_ME",
        values: [
          {
            id: "value-1",
            content: "created",
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
        isNew: true,
      },
    ]);

    const operations = planOperations(baseline, draft).operations;
    expect(operations).toHaveLength(3);
    expect(operations.filter((operation) => operation.kind === "create_env")).toHaveLength(1);
    expect(operations.filter((operation) => operation.kind === "update_env")).toHaveLength(1);
    expect(operations.filter((operation) => operation.kind === "delete_env")).toHaveLength(1);
  });
});
