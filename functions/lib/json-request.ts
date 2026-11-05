/**
 * functions/lib/json-request.ts
 *
 * True when the request declares a JSON body (media type application/json,
 * parameters such as charset allowed, any letter case).
 */
export function isJsonRequest(request: Request): boolean {
  const mediaType = (request.headers.get("Content-Type") ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  return mediaType === "application/json";
}
