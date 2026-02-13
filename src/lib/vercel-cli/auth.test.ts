import { describe, expect, it, vi } from "vitest";

import { getVercelCliAuthStatus } from "./auth";
import { VercelCliError } from "./types";

describe("getVercelCliAuthStatus", () => {
  it("returns authenticated state with identity", async () => {
    const runner = {
      run: vi.fn(async () => ({
        exitCode: 0,
        stdout: "omar\n",
        stderr: "",
        timedOut: false,
      })),
    };

    const status = await getVercelCliAuthStatus(runner as never);

    expect(status).toEqual({
      authenticated: true,
      identity: {
        username: "omar",
        activeScope: null,
      },
      message: "CLI session is active.",
    });
  });

  it("returns explicit unauthenticated state on non-zero exit", async () => {
    const runner = {
      run: vi.fn(async () => {
        throw new VercelCliError({
          code: "cli_non_zero_exit",
          message: "Not logged in",
          exitCode: 1,
          stdout: "",
          stderr: "",
        });
      }),
    };

    const status = await getVercelCliAuthStatus(runner as never);
    expect(status.authenticated).toBe(false);
    expect(status.message).toContain("vercel login");
  });

  it("returns install guidance when CLI is missing", async () => {
    const runner = {
      run: vi.fn(async () => {
        throw new VercelCliError({
          code: "cli_not_found",
          message: "missing",
          exitCode: null,
          stdout: "",
          stderr: "",
        });
      }),
    };

    const status = await getVercelCliAuthStatus(runner as never);
    expect(status.authenticated).toBe(false);
    expect(status.message).toContain("not installed");
  });
});
