import { describe, expect, it, vi } from "vitest";

import type { EnvOperation } from "../env-model";
import { applyPlannedOperations } from "./apply";

function createOperations(): EnvOperation[] {
  return [
    {
      id: "create-combo:row:new:1:value-1",
      kind: "create_env",
      summary: "create",
      rowId: "row:new:1",
      before: null,
      after: {
        rowId: "row:new:1",
        key: "NEW_KEY",
        value: "new-value",
        target: ["production"],
        customEnvironmentIds: [],
      },
      undoToken: "undo:create",
    },
    {
      id: "update-row:env_1",
      kind: "update_env",
      summary: "update",
      rowId: "row:existing",
      before: {
        rowId: "row:existing",
        key: "EXISTING_KEY",
        value: "old",
        target: ["production"],
        customEnvironmentIds: [],
      },
      after: {
        rowId: "row:existing",
        key: "EXISTING_KEY",
        value: "new",
        target: ["production"],
        customEnvironmentIds: [],
      },
      undoToken: "undo:update",
    },
    {
      id: "delete-row:env_2",
      kind: "delete_env",
      summary: "delete",
      rowId: "row:delete",
      before: {
        rowId: "row:delete",
        key: "DELETE_KEY",
        value: "old",
        target: ["preview"],
        customEnvironmentIds: [],
      },
      after: null,
      undoToken: "undo:delete",
    },
    {
      id: "rename:row:noop",
      kind: "rename_key",
      summary: "rename",
      rowId: "row:noop",
      before: null,
      after: null,
      undoToken: "undo:rename",
    },
  ];
}

describe("applyPlannedOperations", () => {
  it("executes create, update, delete in order and records skipped kinds", async () => {
    const callOrder: string[] = [];
    const client = {
      projects: {
        createProjectEnv: vi.fn(async () => {
          callOrder.push("create");
          return { id: "env_created" };
        }),
        editProjectEnv: vi.fn(async () => {
          callOrder.push("update");
          return {};
        }),
        removeProjectEnv: vi.fn(async () => {
          callOrder.push("delete");
          return {};
        }),
      },
    };

    const result = await applyPlannedOperations({
      client: client as never,
      projectId: "prj_1",
      operations: createOperations(),
    });

    expect(callOrder).toEqual(["create", "update", "delete"]);
    expect(result.accepted).toBe(4);
    expect(result.results).toEqual([
      {
        operationId: "create-combo:row:new:1:value-1",
        status: "done",
        createdId: "env_created",
        message: null,
      },
      {
        operationId: "update-row:env_1",
        status: "done",
        createdId: null,
        message: null,
      },
      {
        operationId: "delete-row:env_2",
        status: "done",
        createdId: null,
        message: null,
      },
      {
        operationId: "rename:row:noop",
        status: "skipped",
        createdId: null,
        message: "Operation kind rename_key is not executable yet.",
      },
    ]);
  });

  it("reports partial failures with sanitized fallback error messages", async () => {
    const client = {
      projects: {
        createProjectEnv: vi.fn(async () => {
          throw new Error("create failed");
        }),
        editProjectEnv: vi.fn(async () => {
          throw { code: 500 };
        }),
        removeProjectEnv: vi.fn(async () => ({})),
      },
    };

    const result = await applyPlannedOperations({
      client: client as never,
      projectId: "prj_1",
      operations: createOperations().filter((operation) => operation.kind !== "rename_key"),
    });

    expect(result.results).toEqual([
      {
        operationId: "create-combo:row:new:1:value-1",
        status: "failed",
        createdId: null,
        message: "create failed",
      },
      {
        operationId: "update-row:env_1",
        status: "failed",
        createdId: null,
        message: "Operation failed.",
      },
      {
        operationId: "delete-row:env_2",
        status: "done",
        createdId: null,
        message: null,
      },
    ]);
  });
});
