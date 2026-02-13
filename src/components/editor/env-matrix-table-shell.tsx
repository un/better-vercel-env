"use client";

import { Button } from "@/components/ui/button";
import { useEnvDraftStore } from "@/lib/env-model";

interface EnvMatrixTableShellProps {
  disabled?: boolean;
}

export function EnvMatrixTableShell({ disabled = false }: EnvMatrixTableShellProps) {
  const baseline = useEnvDraftStore((state) => state.baseline);
  const draft = useEnvDraftStore((state) => state.draft);
  const renameRowKey = useEnvDraftStore((state) => state.renameRowKey);
  const addValue = useEnvDraftStore((state) => state.addValue);
  const editValue = useEnvDraftStore((state) => state.editValue);
  const setAssignment = useEnvDraftStore((state) => state.setAssignment);

  const rows = draft?.rows ?? [];
  const environments = draft?.environments ?? [];

  const baselineRowsById = new Map((baseline?.rows ?? []).map((row) => [row.rowId, row]));

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
            <th className="sticky left-0 z-20 bg-muted/40 px-3 py-2 text-left font-medium">Key</th>
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
            const baselineRow = baselineRowsById.get(row.rowId);
            const labelMap = new Map(
              row.values.map((value, index) => [value.id, `Value ${index + 1}`]),
            );
            const keyChanged = !baselineRow || baselineRow.key !== row.key;
            const valuesChanged =
              !baselineRow ||
              JSON.stringify(baselineRow.values.map((value) => value.content)) !==
                JSON.stringify(row.values.map((value) => value.content));

            return (
              <tr key={row.rowId} className="border-b border-border last:border-0">
                <td
                  className={`sticky left-0 z-10 px-3 py-2 align-top ${keyChanged ? "status-update" : "bg-card"}`}
                >
                  <input
                    className={`w-full rounded-md border px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60 ${
                      !row.key.trim() || (keyCounts.get(row.key.trim().toLowerCase()) ?? 0) > 1
                        ? "border-destructive"
                        : "border-border"
                    }`}
                    value={row.key}
                    onChange={(event) => renameRowKey(row.rowId, event.target.value)}
                    aria-label={`Key for row ${row.rowId}`}
                    disabled={disabled}
                  />
                  {!row.key.trim() ? (
                    <p className="mt-1 text-xs text-destructive">Key is required.</p>
                  ) : null}
                  {(keyCounts.get(row.key.trim().toLowerCase()) ?? 0) > 1 ? (
                    <p className="mt-1 text-xs text-destructive">Duplicate key. Use a unique key name.</p>
                  ) : null}
                </td>
                <td className={`px-3 py-2 align-top text-muted-foreground ${valuesChanged ? "status-update" : ""}`}>
                  {row.values.map((value, index) => (
                    <label key={value.id} className="mb-2 block">
                      <span className="mb-1 block text-xs font-medium text-foreground">Value {index + 1}</span>
                      <input
                        className="w-full rounded-md border border-border px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"
                        value={value.content}
                        onChange={(event) => editValue(row.rowId, value.id, event.target.value)}
                        aria-label={`Value ${index + 1} for ${row.key}`}
                        disabled={disabled}
                      />
                    </label>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => addValue(row.rowId)}
                    disabled={disabled}
                  >
                    Add value
                  </Button>
                </td>
                {environments.map((environment) => {
                  const assignedValueId = row.assignments[environment.id];
                  const assignmentChanged =
                    !baselineRow || baselineRow.assignments[environment.id] !== assignedValueId;

                  return (
                    <td
                      key={`${row.rowId}:${environment.id}`}
                      className={`px-3 py-2 align-top text-muted-foreground ${assignmentChanged ? "status-update" : ""}`}
                    >
                      <select
                        className="w-full rounded-md border border-border px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-60"
                        value={assignedValueId ?? ""}
                        onChange={(event) =>
                          setAssignment(
                            row.rowId,
                            environment.id,
                            event.target.value ? event.target.value : null,
                          )
                        }
                        aria-label={`${environment.name} assignment for ${row.key}`}
                        disabled={disabled}
                      >
                        <option value="">Unset</option>
                        {row.values.map((value) => (
                          <option key={value.id} value={value.id}>
                            {labelMap.get(value.id) ?? value.id}
                          </option>
                        ))}
                      </select>
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
