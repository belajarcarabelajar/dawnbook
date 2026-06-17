export const onRequest = async (context: any) => {
  const { request, env } = context;
  const cookieHeader = request.headers.get("Cookie") ?? "";
  const authHeader = request.headers.get("Authorization") ?? "";
  return new Response(JSON.stringify({
    hasSecretKey: !!env.CLERK_SECRET_KEY,
    hasPublishableKey: !!env.CLERK_PUBLISHABLE_KEY,
    cookies: cookieHeader,
    authHeader: authHeader
  }), {
    headers: { "Content-Type": "application/json" }
  });
};
