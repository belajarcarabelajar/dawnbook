import { verifyClerkSession } from "./functions/lib/auth";

const env = {
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || "dummy_publishable_key",
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || "dummy_secret_key",
  DB: {} as any
};

const req = new Request("https://dawnbook.belajarcarabelajar.com", {
  headers: {
    Authorization: "Bearer dummy.token.parts"
  }
});

async function run() {
  const start = performance.now();
  await verifyClerkSession(req, env);
  const end = performance.now();
  console.log(`Time taken: ${(end - start).toFixed(2)}ms`);
}

run();
