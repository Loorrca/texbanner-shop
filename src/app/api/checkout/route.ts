import { and, eq, inArray, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/db";
import { newAccessToken, newOrderNumber, startPayment, uploadsAvailable } from "@/lib/checkout";
import { GOVERNORATES } from "@/lib/governorates";
import { CartItemsSchema, priceCart } from "@/lib/pricing";
import { clientIp, rateLimit } from "@/lib/rate-limit";

class UploadClaimError extends Error {}

const str = (max: number) => z.string().trim().min(1).max(max);
const Body = z.object({
  locale: z.enum(["fr", "ar"]),
  items: CartItemsSchema,
  customer: z.object({
    firstName: str(60),
    lastName: str(60),
    email: z.string().trim().email().max(120),
    // Tunisian numbers: 8 digits, optional +216 / 00216 prefix
    phone: z.string().trim().transform((v) => v.replace(/[\s.-]/g, "")).pipe(z.string().regex(/^(\+216|00216)?[2-9]\d{7}$/)),
    governorate: z.enum(GOVERNORATES.map((g) => g.code) as [string, ...string[]]),
    city: str(80),
    address: str(250),
    postalCode: z.string().trim().max(10).regex(/^\d{0,4}$/).default(""),
    notes: z.string().trim().max(1000).default(""),
  }),
});

export async function POST(req: Request) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 10, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", fields: Object.keys(parsed.error.flatten().fieldErrors), issues: parsed.error.issues.map((i) => i.path.join(".")) }, { status: 400 });
  }
  const { locale, items, customer } = parsed.data;

  const quote = await priceCart(items, locale);
  if (quote.invalid.length || !quote.lines.length) {
    return NextResponse.json({ error: "Cart changed", invalid: quote.invalid }, { status: 409 });
  }
  const uploadIds = quote.lines.flatMap((l) => l.uploadIds);
  if (!(await uploadsAvailable(uploadIds))) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  let order: schema.Order;
  try {
    order = await db.transaction(async (tx) => {
    const [o] = await tx
      .insert(schema.orders)
      .values({ ...customer, number: newOrderNumber(), accessToken: newAccessToken(), locale, subtotal: quote.subtotal, shipping: quote.shipping, total: quote.total })
      .returning();
    for (const line of quote.lines) {
      const [item] = await tx
        .insert(schema.orderItems)
        .values({ orderId: o.id, productId: line.productId, productName: line.name, unitPrice: line.unitPrice, quantity: line.quantity, selections: line.resolved })
        .returning({ id: schema.orderItems.id });
      if (line.uploadIds.length) {
        const claimed = await tx
          .update(schema.uploads)
          .set({ orderItemId: item.id })
          .where(and(inArray(schema.uploads.id, line.uploadIds), isNull(schema.uploads.orderItemId)))
          .returning({ id: schema.uploads.id });
        if (claimed.length !== new Set(line.uploadIds).size) throw new UploadClaimError();
      }
    }
    return o;
    });
  } catch (e) {
    if (e instanceof UploadClaimError) return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
    throw e;
  }

  try {
    const payUrl = await startPayment(order);
    return NextResponse.json({ payUrl, orderUrl: `/${locale}/commande/${order.accessToken}` });
  } catch (e) {
    console.error("[checkout] konnect init failed", order.number, e);
    await db.update(schema.orders).set({ status: "PAYMENT_FAILED" }).where(eq(schema.orders.id, order.id));
    // The order exists: send the customer to its page, where they can retry payment.
    return NextResponse.json({ error: "Payment unavailable", orderUrl: `/${locale}/commande/${order.accessToken}` }, { status: 502 });
  }
}
