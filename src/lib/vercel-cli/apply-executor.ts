import { VercelCliError, defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";
import type { CliApplyAction } from "./apply-builder";
import { redactSensitiveText } from "./redact";

export interface CliApplyActionResult {
  operationId: string;
  actionKind: CliApplyAction["actionKind"];
  status: "done" | "failed" | "skipped";
  message: string | null;
}

interface ExecuteCliAddActionsInput {
  workspacePath: string;
  scope: string | null;
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
        const args = [
          "env",
          "add",
          action.key,
          action.environment,
          "--force",
          "--no-color",
        ];
        if (input.scope) {
          args.push("--scope", input.scope);
        }

        await runner.run({
          executable: "vercel",
          args,
          cwd: input.workspacePath,
          timeoutMs: 30_000,
          stdinText: action.value ?? "",
        });
      } else {
        const args = [
          "env",
          "rm",
          action.key,
          action.environment,
          "-y",
          "--no-color",
        ];
        if (input.scope) {
          args.push("--scope", input.scope);
        }

        await runner.run({
          executable: "vercel",
          args,
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
          message: redactSensitiveText(error.details.message),
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
