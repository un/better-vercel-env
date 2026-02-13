"use client";

import { useEnvDraftStore } from "@/lib/env-model";

export function EnvMatrixTableShell() {
  const draft = useEnvDraftStore((state) => state.draft);
  const renameRowKey = useEnvDraftStore((state) => state.renameRowKey);
  const addValue = useEnvDraftStore((state) => state.addValue);
  const editValue = useEnvDraftStore((state) => state.editValue);

  const rows = draft?.rows ?? [];
  const environments = draft?.environments ?? [];

  const keyCounts = rows.reduce<Map<string, number>>((result, row) => {
    const normalized = row.key.trim().toLowerCase();
    if (!normalized) {
      return result;
    }

    result.set(normalized, (result.get(normalized) ?? 0) + 1);
    return result;
  }, new Map());

  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-3 py-2 text-left font-medium">Key</th>
            <th className="px-3 py-2 text-left font-medium">Values</th>
            {environments.map((environment) => (
              <th key={environment.id} className="px-3 py-2 text-left font-medium">
                {environment.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const labelMap = new Map(
              row.values.map((value, index) => [value.id, `Value ${index + 1}`]),
            );

            return (
              <tr key={row.rowId} className="border-b border-border last:border-0">
                <td className="px-3 py-2 align-top">
                  <input
                    className={`w-full rounded-md border px-2 py-1 text-sm ${
                      !row.key.trim() || (keyCounts.get(row.key.trim().toLowerCase()) ?? 0) > 1
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    value={row.key}
                    onChange={(event) => renameRowKey(row.rowId, event.target.value)}
                    aria-label={`Key for row ${row.rowId}`}
                  />
                  {!row.key.trim() ? (
                    <p className="mt-1 text-xs text-destructive">Key is required.</p>
                  ) : null}
                  {(keyCounts.get(row.key.trim().toLowerCase()) ?? 0) > 1 ? (
                    <p className="mt-1 text-xs text-destructive">Duplicate key. Use a unique key name.</p>
                  ) : null}
                </td>
                <td className="px-3 py-2 align-top text-muted-foreground">
                  {row.values.map((value, index) => (
                    <label key={value.id} className="mb-2 block">
                      <span className="mb-1 block text-xs font-medium text-foreground">Value {index + 1}</span>
                      <input
                        className="w-full rounded-md border border-border px-2 py-1 text-sm"
                        value={value.content}
                        onChange={(event) => editValue(row.rowId, value.id, event.target.value)}
                        aria-label={`Value ${index + 1} for ${row.key}`}
                      />
                    </label>
                  ))}
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs font-medium text-foreground hover:bg-accent"
                    onClick={() => addValue(row.rowId)}
                  >
                    Add value
                  </button>
                </td>
                {environments.map((environment) => {
                  const assignedValueId = row.assignments[environment.id];
                  const label = assignedValueId ? labelMap.get(assignedValueId) ?? "Unknown value" : "Unset";

                  return (
                    <td key={`${row.rowId}:${environment.id}`} className="px-3 py-2 align-top text-muted-foreground">
                      {label}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
