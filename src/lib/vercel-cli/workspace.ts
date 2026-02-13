import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const WORKSPACE_TTL_MS = 15 * 60 * 1000;
const WORKSPACE_ROOT = join(tmpdir(), "vercel-better-env", "cli-workspaces");

const workspaceLastUsedAt = new Map<string, number>();
const workspaceLocks = new Map<string, Promise<void>>();

interface WorkspaceInput {
  projectId: string;
  scope: string;
}

function sanitizeForPath(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

function workspaceFolderName(projectId: string, scope: string): string {
  const digest = createHash("sha1").update(`${scope}::${projectId}`).digest("hex").slice(0, 10);
  return `${sanitizeForPath(scope)}-${sanitizeForPath(projectId)}-${digest}`;
}

export function getWorkspacePath(input: WorkspaceInput): string {
  return join(WORKSPACE_ROOT, workspaceFolderName(input.projectId, input.scope));
}

async function cleanupExpiredWorkspaces(now: number): Promise<void> {
  const expiredPaths = Array.from(workspaceLastUsedAt.entries())
    .filter(([, lastUsedAt]) => now - lastUsedAt > WORKSPACE_TTL_MS)
    .map(([workspacePath]) => workspacePath);

  await Promise.all(
    expiredPaths.map(async (workspacePath) => {
      workspaceLastUsedAt.delete(workspacePath);
      await fs.rm(workspacePath, { recursive: true, force: true });
    }),
  );
}

export async function withWorkspaceLock<T>(workspacePath: string, fn: () => Promise<T>): Promise<T> {
  const previous = workspaceLocks.get(workspacePath) ?? Promise.resolve();

  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });

  const queued = previous.then(() => gate);
  workspaceLocks.set(workspacePath, queued);

  await previous;

  try {
    return await fn();
  } finally {
    release();

    if (workspaceLocks.get(workspacePath) === queued) {
      workspaceLocks.delete(workspacePath);
    }
  }
}

export async function ensureProjectWorkspace(input: WorkspaceInput): Promise<string> {
  const workspacePath = getWorkspacePath(input);
  const now = Date.now();

  await fs.mkdir(WORKSPACE_ROOT, { recursive: true });
  await cleanupExpiredWorkspaces(now);

  await withWorkspaceLock(workspacePath, async () => {
    await fs.mkdir(workspacePath, { recursive: true, mode: 0o700 });
    workspaceLastUsedAt.set(workspacePath, Date.now());
  });

  return workspacePath;
}
