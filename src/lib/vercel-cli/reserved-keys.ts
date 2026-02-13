export const RESERVED_RUNTIME_KEY_PREFIXES = ["VERCEL_"] as const;

export function isReservedRuntimeEnvKey(key: string): boolean {
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
