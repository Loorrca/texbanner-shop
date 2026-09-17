import { NextResponse } from "next/server";
import { z } from "zod";
import { CartItemsSchema, priceCart } from "@/lib/pricing";

const Body = z.object({ locale: z.enum(["fr", "ar"]).default("fr"), items: CartItemsSchema });

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  const quote = await priceCart(parsed.data.items, parsed.data.locale);
  return NextResponse.json({
    lines: quote.lines.map(({ index, unitPrice, lineTotal, resolved }) => ({
      index,
      unitPrice,
      lineTotal,
      resolved: resolved.filter((r) => r.type !== "upload").map(({ label, valueLabel }) => ({ label, valueLabel })),
    })),
    invalid: quote.invalid,
    subtotal: quote.subtotal,
    shipping: quote.shipping,
    total: quote.total,
  });
}
