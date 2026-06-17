export const SUPPORTED_LOCALES = ["en", "id"];
export const DEFAULT_LOCALE = "en";
export const COOKIE_NAME = "dawnbook_lang";

export function resolveLocale({ cookieValue, country }: { cookieValue?: string | null, country?: string | null }): string {
  if (cookieValue === "id") return "id";
  if (cookieValue === "en") return "en";
  if (country === "ID") return "id";
  return DEFAULT_LOCALE;
}
