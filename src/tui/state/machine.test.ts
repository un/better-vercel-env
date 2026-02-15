import { describe, expect, it } from "vitest";

import { createTuiStore } from "./store";

describe("tui state machine", () => {
  it("allows valid transitions", () => {
    const store = createTuiStore();

    store.transitionTo("picker");
    store.transitionTo("editor");
    store.transitionTo("confirm");
    store.transitionTo("report");

    expect(store.getState().screen).toBe("report");
  });

  it("rejects invalid transitions", () => {
    const store = createTuiStore();

    expect(() => store.transitionTo("editor")).toThrowError("Invalid screen transition");
  });
});
