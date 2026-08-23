import { expect, test, describe } from "bun:test";
import {
  resolveLocale,
  SUPPORTED_LOCALES,
  DEFAULT_LOCALE,
  COOKIE_NAME,
} from "../../../functions/lib/i18n";

describe("i18n Constants", () => {
  test("exports expected SUPPORTED_LOCALES array", () => {
    expect(Array.isArray(SUPPORTED_LOCALES)).toBe(true);
    expect(SUPPORTED_LOCALES).toEqual(["en", "id"]);
  });

  test("DEFAULT_LOCALE is included in SUPPORTED_LOCALES", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(SUPPORTED_LOCALES.includes(DEFAULT_LOCALE)).toBe(true);
  });

  test("COOKIE_NAME matches expected identifier", () => {
    expect(COOKIE_NAME).toBe("dawnbook_lang");
  });
});

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
