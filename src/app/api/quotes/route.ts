import { NextResponse } from "next/server";
import { z } from "zod";
import { GOVERNORATES } from "@/lib/governorates";
import { notifyNewQuote } from "@/lib/mail";
import { CartItemsSchema } from "@/lib/pricing";
import { createQuote } from "@/lib/quotes";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const str = (max: number) => z.string().trim().min(1).max(max);
const Body = z.object({
  locale: z.enum(["fr", "ar"]),
  items: CartItemsSchema,
  customer: z.object({
    firstName: str(60),
    lastName: str(60),
    company: z.string().trim().max(120).default(""),
    email: z.string().trim().email().max(120),
    phone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[\s.-]/g, ""))
      .pipe(z.string().regex(/^(\+216|00216)?[2-9]\d{7}$/)),
    governorate: z.enum(GOVERNORATES.map((g) => g.code) as [string, ...string[]]).or(z.literal("")).default(""),
    city: z.string().trim().max(80).default(""),
    message: z.string().trim().max(2000).default(""),
    deadline: z.string().trim().max(120).default(""),
  }),
});

export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", fields: Object.keys(parsed.error.flatten().fieldErrors) }, { status: 400 });
  }
  const { locale, items, customer } = parsed.data;

  const res = await createQuote(items, locale, customer);
  if (!res.ok) return NextResponse.json({ error: "Cart changed", invalid: res.invalid }, { status: 409 });

  // The quote is already saved; a mail problem must never turn into an error for the customer.
  notifyNewQuote(res.quote, res.items);

  return NextResponse.json({ number: res.quote.number, quoteUrl: `/${locale}/devis/${res.quote.accessToken}` });
}
