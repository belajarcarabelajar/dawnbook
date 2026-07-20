/**
 * Auth-speed probe (not a unit test). Benchmarks the D1-based verifySession
 * against a mocked env to detect regressions in the hot path that runs
 * once per gated request.
 *
 * Run with: bun run tests/scripts/test-auth-speed.ts
 */
import { verifySession } from "../../functions/lib/auth";

const SID = "a".repeat(64);

const env: any = {
  GOOGLE_CLIENT_ID: "test_client_id",
  GOOGLE_CLIENT_SECRET: "test_client_secret",
  DB: {
    prepare: (sql: string) => {
      const api: any = {
        bind: () => api,
        first: async () => ({
          s_id: SID,
          s_user_id: "u_123",
          s_expires_at: "2099-01-01T00:00:00.000Z",
          u_id: "u_123",
          u_email: "alice@example.com",
          u_name: "Alice",
          u_picture: null,
          u_role: "reader",
        }),
        run: async () => ({ success: true }),
      };
      return api;
    },
  },
};

const req = new Request("https://dawnbook.belajarcarabelajar.com", {
  headers: { Cookie: `session_id=${SID}` },
});

async function run() {
  const N = 1000;
  const start = performance.now();
  for (let i = 0; i < N; i++) {
    await verifySession(req, env);
  }
  const end = performance.now();
  console.log(
    `D1 verifySession: ${N} calls in ${(end - start).toFixed(2)}ms ` +
      `(${((end - start) / N).toFixed(3)}ms/call)`
  );
}

run();
