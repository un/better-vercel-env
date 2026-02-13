import { defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";

interface LinkWorkspaceInput {
  workspacePath: string;
  project: string;
  scope: string;
}

const linkedWorkspaceKeys = new Set<string>();

function linkedKey(input: LinkWorkspaceInput): string {
  return `${input.workspacePath}::${input.scope}::${input.project}`;
}

export async function linkVercelProjectWorkspace(
  input: LinkWorkspaceInput,
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<void> {
  const key = linkedKey(input);
  if (linkedWorkspaceKeys.has(key)) {
    return;
  }

  await runner.run({
    executable: "vercel",
    args: [
      "link",
      "--yes",
      "--project",
      input.project,
      "--scope",
      input.scope,
      "--no-color",
    ],
    cwd: input.workspacePath,
    timeoutMs: 20_000,
  });

  linkedWorkspaceKeys.add(key);
}
