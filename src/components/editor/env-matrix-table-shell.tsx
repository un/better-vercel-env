"use client";

import { useEnvDraftStore } from "@/lib/env-model";

export function EnvMatrixTableShell() {
  const draft = useEnvDraftStore((state) => state.draft);

  const rows = draft?.rows ?? [];
  const environments = draft?.environments ?? [];

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
                <td className="px-3 py-2 align-top font-medium">{row.key}</td>
                <td className="px-3 py-2 align-top text-muted-foreground">
                  {row.values.map((value, index) => (
                    <div key={value.id}>{`Value ${index + 1}: ${value.content || "(empty)"}`}</div>
                  ))}
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
