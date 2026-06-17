import { createClerkClient } from "@clerk/backend";

export const onRequest = async (context: any) => {
  const { request, env } = context;
  const cookieHeader = request.headers.get("Cookie") ?? "";

  let token = "";
  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    if (cookie.startsWith("__session=")) {
      token = cookie.slice("__session=".length).trim();
    }
  }

  if (!token) return new Response("No token");

  try {
    const clerk = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });
    const result = await clerk.verifyToken(token, { authorizedParties: undefined });
    return new Response(JSON.stringify({ success: true, result }));
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, error: err.message, stack: err.stack }));
  }
};
