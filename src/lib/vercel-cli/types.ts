import type { SpawnOptionsWithoutStdio } from "node:child_process";

export type VercelCliErrorCode =
  | "cli_not_found"
  | "cli_timeout"
  | "cli_non_zero_exit"
  | "cli_io_error";

export interface VercelCliErrorShape {
  code: VercelCliErrorCode;
  message: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
}

export class VercelCliError extends Error {
  readonly details: VercelCliErrorShape;

  constructor(details: VercelCliErrorShape) {
    super(details.message);
    this.name = "VercelCliError";
    this.details = details;
  }
}

export function asVercelCliError(error: unknown): VercelCliError | null {
  if (error instanceof VercelCliError) {
    return error;
  }

  return null;
}

export interface VercelCliCommand {
  readonly executable: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly timeoutMs?: number;
  readonly env?: SpawnOptionsWithoutStdio["env"];
  readonly stdinText?: string;
}

export interface VercelCliCommandResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly timedOut: boolean;
}

export interface VercelCliCommandRunner {
  run(command: VercelCliCommand): Promise<VercelCliCommandResult>;
}
