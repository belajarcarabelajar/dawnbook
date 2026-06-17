import { expect, test, describe } from "bun:test";
import { resolveLocale } from "../../../functions/lib/i18n";

describe("i18n Locale Resolution", () => {
  test("resolves locale from cookie first", () => {
    expect(resolveLocale({ cookieValue: "id", country: "US" })).toBe("id");
  });

  test("resolves locale from country if no cookie", () => {
    expect(resolveLocale({ cookieValue: null, country: "ID" })).toBe("id");
  });

  test("defaults to en if neither matches", () => {
    expect(resolveLocale({ cookieValue: null, country: "JP" })).toBe("en");
  });
});
