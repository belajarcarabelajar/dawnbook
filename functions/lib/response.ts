/**
 * functions/lib/response.ts
 *
 * Shared helper functions for API JSON responses and error responses.
 */

export function jsonResponse(
  data: unknown,
  status = 200,
  headers?: HeadersInit
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function errorResponse(
  message: string,
  status: number,
  headers?: HeadersInit
): Response {
  return jsonResponse({ error: message }, status, headers);
}
