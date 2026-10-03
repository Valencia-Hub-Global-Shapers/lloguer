import { describe, expect, it } from "vitest";
import { generateEditToken, hashEditToken, isWellFormedToken } from "./edit-token";

describe("edit token", () => {
  it("generates unique, well-formed tokens", () => {
    const a = generateEditToken();
    const b = generateEditToken();
    expect(a).not.toBe(b);
    expect(isWellFormedToken(a)).toBe(true);
  });

  it("hashes to a stable 64 char hex digest", () => {
    const token = generateEditToken();
    expect(hashEditToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashEditToken(token)).toBe(hashEditToken(token));
    expect(hashEditToken(token)).not.toBe(token);
  });

  it("rejects malformed tokens", () => {
    expect(isWellFormedToken("short")).toBe(false);
    expect(isWellFormedToken(`${"a".repeat(42)}!`)).toBe(false);
  });
});
