import { spawn } from "node:child_process";

import {
  VercelCliError,
  type VercelCliCommand,
  type VercelCliCommandResult,
  type VercelCliCommandRunner,
} from "./types";

const DEFAULT_TIMEOUT_MS = 20_000;

export class SpawnVercelCliRunner implements VercelCliCommandRunner {
  async run(command: VercelCliCommand): Promise<VercelCliCommandResult> {
    return new Promise<VercelCliCommandResult>((resolve, reject) => {
      const child = spawn(command.executable, [...command.args], {
        cwd: command.cwd,
        env: command.env,
        stdio: "pipe",
      });

      let stdout = "";
      let stderr = "";
      let settled = false;
      let timedOut = false;
      let timeoutHandle: NodeJS.Timeout | null = setTimeout(() => {
        timedOut = true;
        child.kill("SIGTERM");
      }, command.timeoutMs ?? DEFAULT_TIMEOUT_MS);

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");

      child.stdout.on("data", (chunk: string) => {
        stdout += chunk;
      });

      child.stderr.on("data", (chunk: string) => {
        stderr += chunk;
      });

      child.on("error", (error) => {
        if (settled) {
          return;
        }

        settled = true;

        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }

        const errorCode = (error as NodeJS.ErrnoException).code;

        reject(
          new VercelCliError({
            code: errorCode === "ENOENT" ? "cli_not_found" : "cli_io_error",
            message:
              errorCode === "ENOENT"
                ? "Vercel CLI not found. Install it and retry."
                : "Failed to start Vercel CLI command.",
            exitCode: null,
            stdout,
            stderr,
          }),
        );
      });

      child.on("close", (code) => {
        if (settled) {
          return;
        }

        settled = true;

        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }

        if (timedOut) {
          reject(
            new VercelCliError({
              code: "cli_timeout",
              message: "Vercel CLI command timed out.",
              exitCode: code,
              stdout,
              stderr,
            }),
          );
          return;
        }

        if (typeof code !== "number" || code !== 0) {
          reject(
            new VercelCliError({
              code: "cli_non_zero_exit",
              message: "Vercel CLI command failed.",
              exitCode: typeof code === "number" ? code : null,
              stdout,
              stderr,
            }),
          );
          return;
        }

        resolve({
          exitCode: code,
          stdout,
          stderr,
          timedOut: false,
        });
      });

      if (typeof command.stdinText === "string") {
        child.stdin.write(command.stdinText);
      }

      child.stdin.end();
    });
  }
}

export const defaultVercelCliRunner: VercelCliCommandRunner = new SpawnVercelCliRunner();
