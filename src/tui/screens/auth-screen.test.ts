import { describe, expect, it } from "vitest";

import type { AuthScreenModel } from "./auth-screen";

function statusLabel(model: AuthScreenModel): string {
  if (model.loading) {
    return "Checking CLI auth status...";
  }

  if (model.authenticated) {
    return "Authenticated";
  }

  return "Not authenticated";
}

describe("auth screen model semantics", () => {
  it("prioritizes loading label", () => {
    expect(
      statusLabel({
        loading: true,
        authenticated: false,
        username: null,
        activeScope: null,
        message: "",
        error: null,
        keyHints: "",
      }),
    ).toBe("Checking CLI auth status...");
  });

  it("uses authenticated label when loaded", () => {
    expect(
      statusLabel({
        loading: false,
        authenticated: true,
        username: "omar",
        activeScope: null,
        message: "",
        error: null,
        keyHints: "",
      }),
    ).toBe("Authenticated");
  });
});
