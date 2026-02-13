import { describe, expect, it } from "vitest";

import { normalizeSnapshotToDraft } from "./normalize";

describe("normalizeSnapshotToDraft", () => {
  it("groups duplicate keys into one matrix row with deterministic assignments", () => {
    const draft = normalizeSnapshotToDraft({
      projectId: "prj_123",
      baselineHash: "hash",
      environments: [
        { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
        { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
        { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
        { id: "custom:ce_stage", name: "Stage", kind: "custom", customEnvironmentId: "ce_stage" },
      ],
      records: [
        {
          id: "env_1",
          key: "API_URL",
          value: "https://api.prod.local",
          type: "plain",
          target: ["production"],
          customEnvironmentIds: [],
          comment: null,
          gitBranch: null,
          system: false,
          readOnlyReason: null,
        },
        {
          id: "env_2",
          key: "API_URL",
          value: "https://api.nonprod.local",
          type: "plain",
          target: ["preview"],
          customEnvironmentIds: ["ce_stage"],
          comment: null,
          gitBranch: null,
          system: false,
          readOnlyReason: null,
        },
        {
          id: "env_3",
          key: "API_URL",
          value: "https://api.nonprod.local",
          type: "plain",
          target: ["development"],
          customEnvironmentIds: [],
          comment: null,
          gitBranch: null,
          system: false,
          readOnlyReason: null,
        },
      ],
    });

    expect(draft.rows).toHaveLength(1);
    const row = draft.rows[0];

    expect(row.key).toBe("API_URL");
    expect(row.values).toHaveLength(2);
    expect(row.values[0].content).toBe("https://api.nonprod.local");
    expect(row.values[1].content).toBe("https://api.prod.local");

    expect(row.assignments.production).toBe("value-2");
    expect(row.assignments.preview).toBe("value-1");
    expect(row.assignments.development).toBe("value-1");
    expect(row.assignments["custom:ce_stage"]).toBe("value-1");
  });

  it("sorts built-in environments before custom environments", () => {
    const draft = normalizeSnapshotToDraft({
      projectId: "prj_123",
      baselineHash: "hash",
      environments: [
        { id: "custom:ce_beta", name: "Beta", kind: "custom", customEnvironmentId: "ce_beta" },
        { id: "development", name: "Development", kind: "built_in", customEnvironmentId: null },
        { id: "custom:ce_alpha", name: "Alpha", kind: "custom", customEnvironmentId: "ce_alpha" },
        { id: "preview", name: "Preview", kind: "built_in", customEnvironmentId: null },
        { id: "production", name: "Production", kind: "built_in", customEnvironmentId: null },
      ],
      records: [],
    });

    expect(draft.environments.map((environment) => environment.id)).toEqual([
      "production",
      "preview",
      "development",
      "custom:ce_alpha",
      "custom:ce_beta",
    ]);
  });
});
