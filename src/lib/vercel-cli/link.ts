import { defaultVercelCliRunner, type VercelCliCommandRunner } from "./index";

interface LinkWorkspaceInput {
  workspacePath: string;
  project: string;
  scope: string | null;
}

const linkedWorkspaceKeys = new Set<string>();

function linkedKey(input: LinkWorkspaceInput): string {
  return `${input.workspacePath}::${input.scope ?? "personal"}::${input.project}`;
}

export async function linkVercelProjectWorkspace(
  input: LinkWorkspaceInput,
  runner: VercelCliCommandRunner = defaultVercelCliRunner,
): Promise<void> {
  const key = linkedKey(input);
  if (linkedWorkspaceKeys.has(key)) {
    return;
  }

  const args = ["link", "--yes", "--project", input.project, "--no-color"];
  if (input.scope) {
    args.push("--scope", input.scope);
  }

  await runner.run({
    executable: "vercel",
    args,
    cwd: input.workspacePath,
    timeoutMs: 20_000,
  });

  linkedWorkspaceKeys.add(key);
}
