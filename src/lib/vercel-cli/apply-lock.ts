const inFlightApplyLocks = new Set<string>();

export class ApplyLockConflictError extends Error {
  constructor(message = "Another apply request is already in progress for this project scope.") {
    super(message);
    this.name = "ApplyLockConflictError";
  }
}

function lockKey(projectId: string, scopeId: string): string {
  return `${scopeId}::${projectId}`;
}

export async function withProjectApplyLock<T>(
  projectId: string,
  scopeId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = lockKey(projectId, scopeId);

  if (inFlightApplyLocks.has(key)) {
    throw new ApplyLockConflictError();
  }

  inFlightApplyLocks.add(key);

  try {
    return await fn();
  } finally {
    inFlightApplyLocks.delete(key);
  }
}
