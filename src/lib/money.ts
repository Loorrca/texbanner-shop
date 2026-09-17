/** All amounts are integers in millimes (1 TND = 1000 millimes). */
export function formatTND(millimes: number, locale: string = "fr"): string {
  const value = millimes / 1000;
  const n = new Intl.NumberFormat(locale === "ar" ? "ar-TN" : "fr-TN", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(value);
  return locale === "ar" ? `${n} د.ت` : `${n} DT`;
}
