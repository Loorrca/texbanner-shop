import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { startPayment } from "@/lib/checkout";
import { syncPayment } from "@/lib/payments";
import { clientIp, rateLimit } from "@/lib/rate-limit";

/** Retry payment for an unpaid order (new Konnect payment link). */
export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!rateLimit(`pay:${clientIp(req)}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  const { token } = await params;
  let order = await db.query.orders.findFirst({ where: eq(schema.orders.accessToken, token) });
  // The previous link may have been paid in the meantime: check before creating a new one.
  if (order?.konnectPaymentRef) order = (await syncPayment(order.konnectPaymentRef).catch(() => order)) ?? order;
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (order.status !== "PENDING_PAYMENT" && order.status !== "PAYMENT_FAILED") {
    return NextResponse.json({ error: "Order already paid or closed" }, { status: 409 });
  }
  try {
    return NextResponse.json({ payUrl: await startPayment(order) });
  } catch (e) {
    console.error("[pay] konnect init failed", order.number, e);
    return NextResponse.json({ error: "Payment unavailable" }, { status: 502 });
  }
}
