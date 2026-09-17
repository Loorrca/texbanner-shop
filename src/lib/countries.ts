import codes from "./country-codes.json";

/**
 * Flag catalogue used by the flag picker:
 *  - 249 ISO countries (names from the browser/Node Intl data),
 *  - built-in organisations and regions shipped with flag-icons (EU, UN, Arab League, England…),
 *  - custom emblems added in /admin/emblems (codes prefixed with "x-", images in /media).
 */
export const COUNTRY_CODES: string[] = codes;

export type FlagGroup = "country" | "organisation" | "region" | "sport" | "autre";

/** A custom emblem as sent to the browser (subset of the DB row). */
export type CustomFlag = { code: string; nameFr: string; nameAr: string; group: FlagGroup };

type BuiltinExtra = { code: string; fr: string; ar: string; group: FlagGroup };

export const BUILTIN_EXTRAS: BuiltinExtra[] = [
  { code: "un", fr: "Nations unies", ar: "الأمم المتحدة", group: "organisation" },
  { code: "eu", fr: "Union européenne", ar: "الاتحاد الأوروبي", group: "organisation" },
  { code: "arab", fr: "Ligue arabe", ar: "جامعة الدول العربية", group: "organisation" },
  { code: "asean", fr: "ASEAN", ar: "رابطة دول جنوب شرق آسيا", group: "organisation" },
  { code: "eac", fr: "Communauté d'Afrique de l'Est", ar: "مجموعة شرق أفريقيا", group: "organisation" },
  { code: "cefta", fr: "ALECE (CEFTA)", ar: "اتفاقية التجارة الحرة لأوروبا الوسطى", group: "organisation" },
  { code: "pc", fr: "Communauté du Pacifique", ar: "جماعة المحيط الهادئ", group: "organisation" },
  { code: "gb-eng", fr: "Angleterre", ar: "إنجلترا", group: "region" },
  { code: "gb-sct", fr: "Écosse", ar: "اسكتلندا", group: "region" },
  { code: "gb-wls", fr: "Pays de Galles", ar: "ويلز", group: "region" },
  { code: "gb-nir", fr: "Irlande du Nord", ar: "أيرلندا الشمالية", group: "region" },
  { code: "es-ct", fr: "Catalogne", ar: "كتالونيا", group: "region" },
  { code: "es-pv", fr: "Pays basque", ar: "إقليم الباسك", group: "region" },
  { code: "es-ga", fr: "Galice", ar: "غاليسيا", group: "region" },
  { code: "ic", fr: "Îles Canaries", ar: "جزر الكناري", group: "region" },
  { code: "xk", fr: "Kosovo", ar: "كوسوفو", group: "region" },
];
const EXTRA_BY_CODE = new Map(BUILTIN_EXTRAS.map((e) => [e.code, e]));

export const GROUP_LABELS: Record<FlagGroup, { fr: string; ar: string }> = {
  country: { fr: "Pays", ar: "الدول" },
  organisation: { fr: "Organisations", ar: "المنظمات" },
  sport: { fr: "Sport & clubs", ar: "الرياضة والنوادي" },
  region: { fr: "Régions & nations", ar: "الأقاليم" },
  autre: { fr: "Autres emblèmes", ar: "شعارات أخرى" },
};

export const isCustomFlagCode = (code: string) => code.startsWith("x-");

/** Image URL for any flag code. Custom emblems are served by /flags/x/[slug]. */
export function flagSrc(code?: string | null): string {
  const c = (code ?? "tn").toLowerCase();
  if (isCustomFlagCode(c)) return `/flags/x/${encodeURIComponent(c.slice(2))}`;
  return `/flags/${c}.svg`;
}

export function countryName(code: string, locale: string, custom: CustomFlag[] = []): string {
  const extra = EXTRA_BY_CODE.get(code);
  if (extra) return locale === "ar" ? extra.ar : extra.fr;
  const c = custom.find((x) => x.code === code);
  if (c) return locale === "ar" ? c.nameAr : c.nameFr;
  try {
    return new Intl.DisplayNames([locale === "ar" ? "ar" : "fr"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

export type FlagEntry = { code: string; name: string; group: FlagGroup };

/** Ordered picker entries: pinned countries, all countries A–Z, then organisations, sport, regions, others. */
export function sortedCountries(locale: string, custom: CustomFlag[] = []): FlagEntry[] {
  const collator = new Intl.Collator(locale === "ar" ? "ar" : "fr");
  const pinned = ["tn", "dz", "ly", "ma", "fr", "ps"].filter((c) => COUNTRY_CODES.includes(c));
  const byName = (a: FlagEntry, b: FlagEntry) => collator.compare(a.name, b.name);
  const countries = COUNTRY_CODES.filter((c) => !pinned.includes(c))
    .map((code) => ({ code, name: countryName(code, locale), group: "country" as const }))
    .sort(byName);
  const others: FlagEntry[] = [
    ...BUILTIN_EXTRAS.map((e) => ({ code: e.code, name: locale === "ar" ? e.ar : e.fr, group: e.group })),
    ...custom.map((c) => ({ code: c.code, name: locale === "ar" ? c.nameAr : c.nameFr, group: c.group })),
  ];
  const order: FlagGroup[] = ["organisation", "sport", "region", "autre"];
  return [
    ...pinned.map((code) => ({ code, name: countryName(code, locale), group: "country" as const })),
    ...countries,
    ...order.flatMap((g) => others.filter((o) => o.group === g).sort(byName)),
  ];
}

export function isCountryCode(code: unknown, custom: CustomFlag[] = []): code is string {
  return typeof code === "string" && (COUNTRY_CODES.includes(code) || EXTRA_BY_CODE.has(code) || custom.some((c) => c.code === code));
}
