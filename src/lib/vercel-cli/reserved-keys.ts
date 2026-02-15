export const RESERVED_RUNTIME_KEYS = [
  "NX_DAEMON",
  "TURBO_CACHE",
  "TURBO_DOWNLOAD_LOCAL_ENABLED",
  "TURBO_REMOTE_ONLY",
  "TURBO_RUN_SUMMARY",
  "VERCEL",
] as const;

export const RESERVED_RUNTIME_KEY_PREFIXES = ["VERCEL_"] as const;

const RESERVED_RUNTIME_KEY_SET = new Set<string>(RESERVED_RUNTIME_KEYS);

export function isReservedRuntimeEnvKey(key: string): boolean {
  if (RESERVED_RUNTIME_KEY_SET.has(key)) {
    return true;
  }

  return RESERVED_RUNTIME_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function filterReservedRuntimeEnvKeys(values: Record<string, string>): {
  editable: Record<string, string>;
  reservedKeys: string[];
} {
  const editable: Record<string, string> = {};
  const reservedKeys: string[] = [];

  Object.keys(values)
    .sort((left, right) => left.localeCompare(right))
    .forEach((key) => {
      if (isReservedRuntimeEnvKey(key)) {
        reservedKeys.push(key);
        return;
      }

      editable[key] = values[key];
    });

  return { editable, reservedKeys };
}
