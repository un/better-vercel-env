import type { BuiltInEnvironmentId } from "@/lib/types";

import { defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";

export interface VercelEnvTopologyRow {
  key: string;
  target: BuiltInEnvironmentId[];
}

function environmentNameToId(value: string): BuiltInEnvironmentId | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === "production") {
    return "production";
  }

  if (normalized === "preview") {
    return "preview";
  }

  if (normalized === "development") {
    return "development";
  }

  return null;
}

function environmentOrder(environment: BuiltInEnvironmentId): number {
  if (environment === "production") {
    return 0;
  }

  if (environment === "preview") {
    return 1;
  }

  return 2;
}

function parseEnvironmentList(raw: string): BuiltInEnvironmentId[] {
  return raw
    .split(/,|\band\b/gi)
    .map((item) => environmentNameToId(item))
    .filter((item): item is BuiltInEnvironmentId => Boolean(item))
    .sort((left, right) => environmentOrder(left) - environmentOrder(right));
}

export function parseVercelEnvListOutput(stdout: string): VercelEnvTopologyRow[] {
  const lines = stdout
    .split(/\r?\n/)
    .map((line) => line.replace(/\u001b\[[0-9;]*m/g, "").trimEnd())
    .filter((line) => line.trim().length > 0);

  const rows: VercelEnvTopologyRow[] = [];

  lines.forEach((line) => {
    if (
      /^vercel cli/i.test(line) ||
      /^retrieving project/i.test(line) ||
      /^>\s*environment variables/i.test(line) ||
      /^name\s{2,}/i.test(line)
    ) {
      return;
    }

    const columns = line.trim().split(/\s{2,}/).filter(Boolean);
    if (columns.length < 3) {
      return;
    }

    const key = columns[0]?.trim();
    const target = parseEnvironmentList(columns[2] ?? "");
    if (!key || target.length === 0) {
      return;
    }

    rows.push({ key, target });
  });

  return rows;
}

export async function listVercelEnvTopology(
  workspacePath: string,
  scope: string | null,
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<VercelEnvTopologyRow[]> {
  const args = ["env", "ls", "--no-color"];
  if (scope) {
    args.push("--scope", scope);
  }

  const result = await runner.run({
    executable: "vercel",
    args,
    cwd: workspacePath,
    timeoutMs: 20_000,
  });

  return parseVercelEnvListOutput(result.stdout);
}
