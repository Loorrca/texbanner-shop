import { z } from "zod";
import { countryName, isCountryCode, type CustomFlag } from "./countries";

/**
 * Product customisation options.
 * Stored as JSON on Product.options and validated here, so the admin
 * cannot save a malformed product and the server always re-prices orders.
 */
const Label = {
  labelFr: z.string().min(1),
  labelAr: z.string().min(1),
  /** Only show / apply this option when another select has a given value */
  showIf: z.object({ key: z.string(), value: z.string() }).optional(),
};

export const ChoiceSchema = z.object({
  value: z.string().min(1),
  ...Label,
  priceDelta: z.number().int().default(0),
  /** Optional image replacing the product photo when selected */
  image: z.string().optional(),
  /** Optional colour swatch (hex) */
  swatch: z.string().optional(),
});

export const OptionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("select"),
    key: z.string().min(1),
    ...Label,
    choices: z.array(ChoiceSchema).min(1),
    default: z.string().optional(),
  }),
  z.object({
    type: z.literal("country"),
    key: z.string().min(1),
    ...Label,
    default: z.string().default("tn"),
    priceDelta: z.number().int().default(0),
  }),
  z.object({
    type: z.literal("text"),
    key: z.string().min(1),
    ...Label,
    required: z.boolean().default(false),
    maxLength: z.number().int().positive().default(120),
    multiline: z.boolean().default(false),
    /** Added only when the customer actually types something */
    priceDelta: z.number().int().default(0),
    placeholderFr: z.string().optional(),
    placeholderAr: z.string().optional(),
  }),
  z.object({
    type: z.literal("upload"),
    key: z.string().min(1),
    ...Label,
    required: z.boolean().default(false),
    priceDelta: z.number().int().default(0),
  }),
]);

export const OptionsSchema = z.array(OptionSchema);
export type ProductOption = z.infer<typeof OptionSchema>;
export type OptionChoice = z.infer<typeof ChoiceSchema>;

/** What the browser sends: option key -> raw value (choice value, country code, text, upload id). */
export type Selections = Record<string, string>;

export type ResolvedSelection = {
  key: string;
  label: string;
  value: string;
  valueLabel: string;
  priceDelta: number;
  type: ProductOption["type"];
};

export function parseOptions(raw: unknown): ProductOption[] {
  return OptionsSchema.parse(raw);
}

export function label(o: { labelFr: string; labelAr: string }, locale: string) {
  return locale === "ar" ? o.labelAr : o.labelFr;
}

export function defaultSelections(options: ProductOption[]): Selections {
  const s: Selections = {};
  for (const o of options) {
    if (o.type === "select") s[o.key] = o.default ?? o.choices[0].value;
    if (o.type === "country") s[o.key] = o.default;
  }
  return s;
}

export function isVisible(o: ProductOption, options: ProductOption[], selections: Selections) {
  if (!o.showIf) return true;
  const dep = options.find((x) => x.key === o.showIf!.key);
  const current = selections[o.showIf.key] ?? (dep?.type === "select" ? dep.default ?? dep.choices[0].value : undefined);
  return current === o.showIf.value;
}

export class SelectionError extends Error {}

/**
 * Validate selections against the product definition and compute the unit price.
 * Used both client-side (display) and server-side (authoritative).
 */
export function resolveSelections(
  basePrice: number,
  options: ProductOption[],
  selections: Selections,
  locale: string,
  /** Active custom emblems (from /admin/emblems), accepted by country options */
  customFlags: CustomFlag[] = [],
): { unitPrice: number; resolved: ResolvedSelection[] } {
  let unitPrice = basePrice;
  const resolved: ResolvedSelection[] = [];

  for (const o of options) {
    if (!isVisible(o, options, selections)) continue;
    const raw = selections[o.key];
    const optLabel = label(o, locale);

    switch (o.type) {
      case "select": {
        const choice = o.choices.find((c) => c.value === (raw ?? o.default ?? o.choices[0].value));
        if (!choice) throw new SelectionError(`Invalid choice for ${o.key}`);
        unitPrice += choice.priceDelta;
        resolved.push({ key: o.key, label: optLabel, value: choice.value, valueLabel: label(choice, locale), priceDelta: choice.priceDelta, type: o.type });
        break;
      }
      case "country": {
        const code = raw ?? o.default;
        if (!isCountryCode(code, customFlags)) throw new SelectionError(`Invalid country for ${o.key}`);
        unitPrice += o.priceDelta;
        resolved.push({ key: o.key, label: optLabel, value: code, valueLabel: countryName(code, locale, customFlags), priceDelta: o.priceDelta, type: o.type });
        break;
      }
      case "text": {
        const text = (raw ?? "").trim();
        if (o.required && !text) throw new SelectionError(`Missing text for ${o.key}`);
        if (text.length > o.maxLength) throw new SelectionError(`Text too long for ${o.key}`);
        if (text) {
          unitPrice += o.priceDelta;
          resolved.push({ key: o.key, label: optLabel, value: text, valueLabel: text, priceDelta: o.priceDelta, type: o.type });
        }
        break;
      }
      case "upload": {
        const id = (raw ?? "").trim();
        if (o.required && !id) throw new SelectionError(`Missing file for ${o.key}`);
        if (id) {
          unitPrice += o.priceDelta;
          resolved.push({ key: o.key, label: optLabel, value: id, valueLabel: "✓", priceDelta: o.priceDelta, type: o.type });
        }
        break;
      }
    }
  }
  return { unitPrice, resolved };
}
