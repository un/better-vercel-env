import { describe, expect, it } from "vitest";

import { add } from "./math";

describe("add", () => {
  it("returns the sum of two values", () => {
    expect(add(2, 3)).toBe(5);
  });
});
