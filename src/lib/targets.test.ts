import { describe, expect, it } from "vitest";
import { TARGET_TYPES } from "@/lib/targets";

describe("TARGET_TYPES", () => {
  it("includes the required built-in target types", () => {
    expect(TARGET_TYPES.map((item) => item.id)).toEqual([
      "general",
      "jimeng",
      "grok",
      "nano-banana"
    ]);
  });
});
