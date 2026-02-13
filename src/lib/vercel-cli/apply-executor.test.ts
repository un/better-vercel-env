import { describe, expect, it, vi } from "vitest";

import { VercelCliError } from "./types";
import { executeCliAddActions } from "./apply-executor";
import type { CliApplyAction } from "./apply-builder";

describe("executeCliAddActions", () => {
  it("executes add and remove actions in order", async () => {
    const calls: Array<{ args: string[]; stdinText?: string }> = [];
    const runner = {
      run: vi.fn(async (command: { args: string[]; stdinText?: string }) => {
        calls.push({ args: command.args, stdinText: command.stdinText });
        return { exitCode: 0, stdout: "", stderr: "", timedOut: false };
      }),
    };

    const actions: CliApplyAction[] = [
      {
        operationId: "op-1",
        actionKind: "add",
        key: "ALPHA",
        environment: "development",
        value: "value-a",
        reason: null,
      },
      {
        operationId: "op-2",
        actionKind: "remove",
        key: "BETA",
        environment: "preview",
        value: null,
        reason: null,
      },
    ];

    const results = await executeCliAddActions(
      {
        workspacePath: "/tmp/workspace",
        scope: "personal",
        actions,
      },
      runner as never,
    );

    expect(results.map((item) => item.status)).toEqual(["done", "done"]);
    expect(calls[0]?.args.slice(0, 4)).toEqual(["env", "add", "ALPHA", "development"]);
    expect(calls[0]?.stdinText).toBe("value-a\n");
    expect(calls[1]?.args.slice(0, 4)).toEqual(["env", "rm", "BETA", "preview"]);
    expect(calls[1]?.stdinText).toBeUndefined();
  });

  it("reports partial failures and redacts secret-looking messages", async () => {
    const runner = {
      run: vi.fn(async () => {
        throw new VercelCliError({
          code: "cli_non_zero_exit",
          message: "Command failed: API_KEY=super-secret-value",
          exitCode: 1,
          stdout: "",
          stderr: "",
        });
      }),
    };

    const results = await executeCliAddActions(
      {
        workspacePath: "/tmp/workspace",
        scope: "personal",
        actions: [
          {
            operationId: "op-1",
            actionKind: "add",
            key: "ALPHA",
            environment: "production",
            value: "value-a",
            reason: null,
          },
        ],
      },
      runner as never,
    );

    expect(results).toEqual([
      {
        operationId: "op-1",
        actionKind: "add",
        status: "failed",
        message: "Command failed: API_KEY=[REDACTED]",
      },
    ]);
  });
});
