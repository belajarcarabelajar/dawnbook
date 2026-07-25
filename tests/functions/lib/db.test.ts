import { describe, expect, it } from "bun:test";
import { generateUserId } from "../../../functions/lib/db";

describe("generateUserId", () => {
  it("should generate a 32-character hex string", () => {
    const id = generateUserId();
    expect(typeof id).toBe("string");
    expect(id.length).toBe(32);
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it("should generate unique ids", () => {
    const id1 = generateUserId();
    const id2 = generateUserId();
    expect(id1).not.toEqual(id2);
  });
});
