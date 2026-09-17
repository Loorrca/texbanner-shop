import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { shippingFor, SHOP } from "./config";
import { getCustomFlags } from "./emblems";
import { resolveSelections, SelectionError, type ResolvedSelection } from "./options";

export const CartItemsSchema = z
  .array(
    z.object({
      slug: z.string().min(1).max(100),
      quantity: z.number().int().min(1).max(SHOP.maxQuantityPerLine),
      selections: z.record(z.string().max(100), z.string().max(500)),
    }),
  )
  .min(1)
  .max(50);

export type PricedLine = {
  index: number;
  productId: string;
  slug: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  resolved: ResolvedSelection[];
  uploadIds: string[];
};

export type Quote = { lines: PricedLine[]; invalid: number[]; subtotal: number; shipping: number; total: number };

/** Authoritative pricing from the database. Never trust prices sent by the browser. */
export async function priceCart(items: z.infer<typeof CartItemsSchema>, locale: string): Promise<Quote> {
  const slugs = [...new Set(items.map((i) => i.slug))];
  const products = await db.query.products.findMany({ where: and(inArray(schema.products.slug, slugs), eq(schema.products.active, true)) });
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const customFlags = await getCustomFlags();

  const lines: PricedLine[] = [];
  const invalid: number[] = [];
  items.forEach((item, index) => {
    const p = bySlug.get(item.slug);
    if (!p) return invalid.push(index);
    try {
      const { unitPrice, resolved } = resolveSelections(p.basePrice, p.options, item.selections, locale, customFlags);
      if (unitPrice < 0) throw new SelectionError("negative price");
      lines.push({
        index,
        productId: p.id,
        slug: p.slug,
        name: locale === "ar" ? p.nameAr : p.nameFr,
        unitPrice,
        quantity: item.quantity,
        lineTotal: unitPrice * item.quantity,
        resolved,
        uploadIds: resolved.filter((r) => r.type === "upload").map((r) => r.value),
      });
    } catch (e) {
      if (e instanceof SelectionError) invalid.push(index);
      else throw e;
    }
  });

  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);
  const shipping = lines.length ? shippingFor(subtotal) : 0;
  return { lines, invalid, subtotal, shipping, total: subtotal + shipping };
}
