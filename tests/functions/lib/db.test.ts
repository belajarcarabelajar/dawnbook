import { expect, test, describe, beforeEach } from "bun:test";
import { createSession } from "../../../functions/lib/db";
import {
  createMockEnv,
  setQueryHandler,
  setRunHandler,
} from "../../helpers/mocks";

beforeEach(() => {
  // createMockEnv() gives us a clean DB on every call, so nothing is strictly needed here,
  // but it's good practice.
});

describe("createSession", () => {
  test("inserts a new session and returns the inserted row", async () => {
    const env = createMockEnv();

    // Mock the INSERT run handler
    setRunHandler(env, "INSERT", () => ({ success: true }));

    // Mock the SELECT query handler
    const mockSessionRow = {
      id: "session_id_123",
      user_id: "user_id_456",
      expires_at: "2099-01-01T00:00:00.000Z",
      created_at: "2024-01-01T00:00:00.000Z",
      last_seen_at: "2024-01-01T00:00:00.000Z",
      user_agent: "Mozilla/5.0",
      ip: "127.0.0.1",
    };

    setQueryHandler(env, "SELECT", () => [mockSessionRow]);

    const result = await createSession(env.DB, {
      id: "session_id_123",
      user_id: "user_id_456",
      expires_at: "2099-01-01T00:00:00.000Z",
      user_agent: "Mozilla/5.0",
      ip: "127.0.0.1",
    });

    expect(result).toEqual(mockSessionRow);
  });

  test("throws an error if row is not found after insert", async () => {
    const env = createMockEnv();

    setRunHandler(env, "INSERT", () => ({ success: true }));
    setQueryHandler(env, "SELECT", () => []); // Return empty array to simulate not found

    expect(
      createSession(env.DB, {
        id: "session_id_123",
        user_id: "user_id_456",
        expires_at: "2099-01-01T00:00:00.000Z",
      }),
    ).rejects.toThrow("createSession: row not found after insert");
  });
});
