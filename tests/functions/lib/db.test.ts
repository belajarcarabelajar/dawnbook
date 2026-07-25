import { expect, test, describe, beforeEach } from "bun:test";
import { deleteSession } from "../../../functions/lib/db";
import { createMockEnv, setRunHandler } from "../../helpers/mocks";

describe("deleteSession", () => {
  beforeEach(() => {
    // Before each hook, clean state if needed
  });

  test("returns true when D1 run returns success: true", async () => {
    const env = createMockEnv();
    setRunHandler(env, "DELETE FROM sessions", (sql, params) => {
      expect(sql).toContain("DELETE FROM sessions WHERE id = ?1");
      expect(params).toEqual(["test_session_id"]);
      return { success: true };
    });

    const result = await deleteSession(env.DB, "test_session_id");
    expect(result).toBe(true);
  });

  test("returns false when D1 run returns success: false", async () => {
    const env = createMockEnv();
    setRunHandler(env, "DELETE FROM sessions", (sql, params) => {
      expect(sql).toContain("DELETE FROM sessions WHERE id = ?1");
      expect(params).toEqual(["test_session_id"]);
      return { success: false };
    });

    const result = await deleteSession(env.DB, "test_session_id");
    expect(result).toBe(false);
  });
});
