import { describe, expect, it } from "vitest";

import { buildSnapshotFromPulledEnvs } from "./snapshot";

describe("buildSnapshotFromPulledEnvs", () => {
  it("creates deterministic records across environments and filters reserved keys", () => {
    const snapshot = buildSnapshotFromPulledEnvs("prj_1", {
      development: {
        SHARED_KEY: "dev-shared",
        DEV_ONLY: "dev-only",
        NX_DAEMON: "1",
        TURBO_CACHE: "local:rw",
        TURBO_DOWNLOAD_LOCAL_ENABLED: "true",
        TURBO_REMOTE_ONLY: "false",
        TURBO_RUN_SUMMARY: "true",
        VERCEL: "1",
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

    const blockedKeys = new Set([
      "NX_DAEMON",
      "TURBO_CACHE",
      "TURBO_DOWNLOAD_LOCAL_ENABLED",
      "TURBO_REMOTE_ONLY",
      "TURBO_RUN_SUMMARY",
      "VERCEL",
      "VERCEL_OIDC_TOKEN",
    ]);

    expect(snapshot.records.some((record) => blockedKeys.has(record.key))).toBe(false);
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

  it("uses env topology rows when available", () => {
    const snapshot = buildSnapshotFromPulledEnvs(
      "prj_3",
      {
        development: { IN_ALL: "reallyAll" },
        preview: { IN_ALL: "reallyAll" },
        production: { IN_ALL: "reallyAll" },
      },
      [
        { key: "IN_ALL", target: ["development"] },
        { key: "IN_ALL", target: ["production", "preview"] },
      ],
    );

    expect(snapshot.records).toHaveLength(2);
    expect(snapshot.records.map((record) => record.target)).toEqual([
      ["production", "preview"],
      ["development"],
    ]);
  });
});
