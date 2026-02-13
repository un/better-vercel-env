import { VercelCliError, defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";
import type { CliApplyAction } from "./apply-builder";

export interface CliApplyActionResult {
  operationId: string;
  actionKind: CliApplyAction["actionKind"];
  status: "done" | "failed" | "skipped";
  message: string | null;
}

interface ExecuteCliAddActionsInput {
  workspacePath: string;
  scope: string;
  actions: CliApplyAction[];
}

export async function executeCliAddActions(
  input: ExecuteCliAddActionsInput,
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<CliApplyActionResult[]> {
  const results: CliApplyActionResult[] = [];

  for (const action of input.actions) {
    if (action.actionKind === "skip") {
      results.push({
        operationId: action.operationId,
        actionKind: action.actionKind,
        status: "skipped",
        message: action.reason,
      });
      continue;
    }

    if (!action.key || !action.environment) {
      results.push({
        operationId: action.operationId,
        actionKind: action.actionKind,
        status: "failed",
        message: "invalid_action",
      });
      continue;
    }

    try {
      if (action.actionKind === "add") {
        await runner.run({
          executable: "vercel",
          args: [
            "env",
            "add",
            action.key,
            action.environment,
            "--scope",
            input.scope,
            "--force",
            "--no-color",
          ],
          cwd: input.workspacePath,
          timeoutMs: 30_000,
          stdinText: `${action.value ?? ""}\n`,
        });
      } else {
        await runner.run({
          executable: "vercel",
          args: [
            "env",
            "rm",
            action.key,
            action.environment,
            "--scope",
            input.scope,
            "-y",
            "--no-color",
          ],
          cwd: input.workspacePath,
          timeoutMs: 30_000,
        });
      }

      results.push({
        operationId: action.operationId,
        actionKind: action.actionKind,
        status: "done",
        message: null,
      });
    } catch (error) {
      if (error instanceof VercelCliError) {
        results.push({
          operationId: action.operationId,
          actionKind: action.actionKind,
          status: "failed",
          message: error.details.message,
        });
        continue;
      }

      results.push({
        operationId: action.operationId,
        actionKind: action.actionKind,
        status: "failed",
        message: "add_operation_failed",
      });
    }
  }

  return results;
}
