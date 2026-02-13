import { describe, expect, it } from "vitest";

import { buildSnapshotFromPulledEnvs } from "./snapshot";

describe("buildSnapshotFromPulledEnvs", () => {
  it("creates deterministic records across environments and filters reserved keys", () => {
    const snapshot = buildSnapshotFromPulledEnvs("prj_1", {
      development: {
        SHARED_KEY: "dev-shared",
        DEV_ONLY: "dev-only",
        VERCEL_OIDC_TOKEN: "secret-token",
      },
      preview: {
        SHARED_KEY: "preview-shared",
      },
      production: {
        SHARED_KEY: "prod-shared",
        PROD_ONLY: "prod-only",
      },
    });

    expect(snapshot.capabilities).toEqual({
      supportsCustomEnvironments: false,
      supportsBranchSpecificWrites: false,
    });

    expect(snapshot.records.map((record) => `${record.key}:${record.target[0]}`)).toEqual([
      "DEV_ONLY:development",
      "PROD_ONLY:production",
      "SHARED_KEY:production",
      "SHARED_KEY:preview",
      "SHARED_KEY:development",
    ]);

    expect(snapshot.records.some((record) => record.key.startsWith("VERCEL_"))).toBe(false);
  });

  it("handles missing keys in some environments", () => {
    const snapshot = buildSnapshotFromPulledEnvs("prj_2", {
      development: {
        API_KEY: "dev",
      },
      preview: {},
      production: {
        API_KEY: "prod",
      },
    });

    expect(snapshot.records).toHaveLength(2);
    expect(snapshot.records.find((record) => record.target[0] === "preview")).toBeUndefined();
  });
});
