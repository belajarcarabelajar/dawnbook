/**
 * functions/lib/response.ts
 *
 * Shared utility functions for standard API JSON and error responses.
 */

/**
 * Constructs a JSON Response object.
 * Defaults to status 200 and "Cache-Control: no-store", but custom status
 * or additional headers (such as edge caching controls) can be provided.
 */
export function jsonResponse(
  data: unknown,
  status = 200,
  headers?: HeadersInit,
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

/**
 * Constructs a JSON error Response object with an { error: message } body.
 */
export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
