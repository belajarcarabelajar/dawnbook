import { describe, expect, test } from "bun:test";
import { jsonResponse, errorResponse } from "../../../functions/lib/response";

describe("Response Helpers", () => {
  describe("jsonResponse", () => {
    test("returns 200 JSON response by default", async () => {
      const data = { ok: true, message: "Success" };
      const res = jsonResponse(data);

      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(await res.json()).toEqual(data);
    });

    test("supports custom status codes", async () => {
      const data = { created: true };
      const res = jsonResponse(data, 201);

      expect(res.status).toBe(201);
      expect(await res.json()).toEqual(data);
    });

    test("allows overriding/adding custom headers", async () => {
      const data = { hello: "world" };
      const res = jsonResponse(data, 200, {
        "X-Custom-Header": "TestValue",
        "Cache-Control": "public, max-age=3600",
      });

      expect(res.headers.get("X-Custom-Header")).toBe("TestValue");
      expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
    });
  });

  describe("errorResponse", () => {
    test("returns error object with specified status code", async () => {
      const res = errorResponse("Unauthorized access", 401);

      expect(res.status).toBe(401);
      expect(res.headers.get("Content-Type")).toBe("application/json");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
      expect(await res.json()).toEqual({ error: "Unauthorized access" });
    });

    test("supports custom status codes and custom headers", async () => {
      const res = errorResponse("Not Found", 404, { "X-Error-Code": "40401" });

      expect(res.status).toBe(404);
      expect(res.headers.get("X-Error-Code")).toBe("40401");
      expect(await res.json()).toEqual({ error: "Not Found" });
    });
  });
});
