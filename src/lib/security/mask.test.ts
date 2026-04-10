import { describe, expect, it } from "vitest";
import { maskApiKey } from "@/lib/security/mask";

describe("maskApiKey", () => {
  it("keeps only the suffix visible", () => {
    expect(maskApiKey("sk-1234567890abcd")).toBe("*************abcd");
  });
});
