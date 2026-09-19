import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { db, schema } from "@/db";
import { newAccessToken } from "./checkout";
import { priceCart, type CartItemsSchema } from "./pricing";
import type { z } from "zod";

/** Quantity from which the shop suggests a quote rather than a direct order. */
export const QUOTE_THRESHOLD = Math.max(1, Number(process.env.QUOTE_THRESHOLD_QTY ?? 20) || 20);

export function newQuoteNumber() {
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
  return "DV-" + Array.from(randomBytes(8), (b) => alphabet[b % alphabet.length]).join("");
}

export type QuoteCustomer = {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  phone: string;
  governorate: string;
  city: string;
  message: string;
  deadline: string;
};

/**
 * Creates a quote request from cart lines. The lines are re-resolved server-side exactly as
 * for an order, so a quote can never carry an option or a flag the catalogue does not allow;
 * the price stored is only indicative, since the whole point is that the shop quotes its own.
 */
export async function createQuote(
  items: z.infer<typeof CartItemsSchema>,
  locale: string,
  customer: QuoteCustomer,
): Promise<{ ok: true; quote: schema.Quote; items: schema.QuoteItem[] } | { ok: false; invalid: number[] }> {
  const priced = await priceCart(items, locale);
  if (priced.invalid.length || !priced.lines.length) return { ok: false, invalid: priced.invalid };

  const created = await db.transaction(async (tx) => {
    const [q] = await tx
      .insert(schema.quotes)
      .values({
        ...customer,
        number: newQuoteNumber(),
        accessToken: newAccessToken(),
        locale,
        indicativeTotal: priced.subtotal,
      })
      .returning();

    const items: schema.QuoteItem[] = [];
    for (const line of priced.lines) {
      const [item] = await tx
        .insert(schema.quoteItems)
        .values({
          quoteId: q.id,
          productId: line.productId,
          productName: line.name,
          unitPrice: line.unitPrice,
          quantity: line.quantity,
          selections: line.resolved,
        })
        .returning();
      items.push(item);

      // Link the customer's files so the shop can download them. Unlike an order this claim is
      // not exclusive: the same file may still be used if the customer later orders directly.
      if (line.uploadIds.length) {
        await tx
          .update(schema.uploads)
          .set({ quoteItemId: item.id })
          .where(and(inArray(schema.uploads.id, [...new Set(line.uploadIds)]), isNull(schema.uploads.quoteItemId)));
      }
    }
    return { quote: q, items };
  });

  return { ok: true, ...created };
}

export async function getQuoteByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  return db.query.quotes.findFirst({ where: eq(schema.quotes.accessToken, token), with: { items: true } });
}
