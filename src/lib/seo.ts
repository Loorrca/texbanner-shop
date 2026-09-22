import type { Metadata } from "next";
import { LOCALES, type Locale } from "./i18n";

/**
 * Canonical and hreflang for one page, in every language.
 *
 * Without this, the `alternates` declared once in the layout would be inherited by every page,
 * telling search engines that a product page's Arabic version is the Arabic home page.
 * `path` is the part after the locale, starting with a slash, or "" for the home page.
 */
export function localeAlternates(locale: Locale, path: string): Metadata["alternates"] {
  const languages = Object.fromEntries(LOCALES.map((l) => [l, `/${l}${path}`]));
  return {
    canonical: `/${locale}${path}`,
    languages: { ...languages, "x-default": `/fr${path}` },
  };
}
