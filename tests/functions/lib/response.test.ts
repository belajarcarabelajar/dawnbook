import { expect, test, describe } from "bun:test";
import { jsonResponse, errorResponse } from "../../../functions/lib/response";

describe("functions/lib/response", () => {
  describe("jsonResponse", () => {
    test("returns a Response object with default 200 status and application/json headers", async () => {
      const data = { success: true, count: 42 };
      const res = jsonResponse(data);

      expect(res).toBeInstanceOf(Response);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(res.headers.get("Cache-Control")).toBe("no-store");

      const body = await res.json();
      expect(body).toEqual(data);
    });

    test("supports custom status codes", async () => {
      const data = { id: "created_123" };
      const res = jsonResponse(data, 201);

      expect(res.status).toBe(201);
      const body = await res.json();
      expect(body).toEqual(data);
    });

    test("allows overriding headers (e.g., custom Cache-Control)", async () => {
      const data = { stats: "ok" };
      const res = jsonResponse(data, 200, {
        "Cache-Control": "public, max-age=300",
        "X-Custom-Header": "test-value",
      });

      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=300");
      expect(res.headers.get("X-Custom-Header")).toBe("test-value");
    });
  });

  describe("errorResponse", () => {
    test("returns a JSON response formatted as { error: message } with given status", async () => {
      const res = errorResponse("Unauthorized access", 401);

      expect(res.status).toBe(401);
      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(res.headers.get("Cache-Control")).toBe("no-store");

      const body = await res.json();
      expect(body).toEqual({ error: "Unauthorized access" });
    });

    test("correctly handles different error status codes", async () => {
      const res = errorResponse("Resource not found", 404);

      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body).toEqual({ error: "Resource not found" });
    });
  });
});
