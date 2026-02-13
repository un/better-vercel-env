import { promises as fs } from "node:fs";
import { join } from "node:path";

import type { BuiltInEnvironmentId } from "@/lib/types";

import { defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";

export const BUILT_IN_ENVIRONMENTS: BuiltInEnvironmentId[] = [
  "development",
  "preview",
  "production",
];

interface EnvPullInput {
  workspacePath: string;
  scope: string | null;
  environment: BuiltInEnvironmentId;
}

export interface PulledEnvFile {
  environment: BuiltInEnvironmentId;
  filePath: string;
}

function pulledFilePath(workspacePath: string, environment: BuiltInEnvironmentId): string {
  return join(workspacePath, `.vbe.pull.${environment}.env`);
}

export async function pullVercelEnvToFile(
  input: EnvPullInput,
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<PulledEnvFile> {
  const filePath = pulledFilePath(input.workspacePath, input.environment);

  const args = [
    "env",
    "pull",
    filePath,
    "--environment",
    input.environment,
    "--yes",
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

  await fs.chmod(filePath, 0o600);

  return {
    environment: input.environment,
    filePath,
  };
}

export async function pullAllBuiltInEnvironments(
  workspacePath: string,
  scope: string | null,
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<PulledEnvFile[]> {
  const pulled: PulledEnvFile[] = [];

  for (const environment of BUILT_IN_ENVIRONMENTS) {
    const result = await pullVercelEnvToFile(
      {
        workspacePath,
        scope,
        environment,
      },
      runner,
    );

    pulled.push(result);
  }

  return pulled;
}
